import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Queue } from 'bull';
import { ChatRoomService } from 'src/chat-room/services/chat-room.service';
import { MessageService } from 'src/message/services/message.service';
import { NetworkService } from 'src/network/services/network.service';
import { RoomActionTxService } from 'src/room-action-tx/services/room-action-tx.service';
import { RoomNotificationTxService } from 'src/room-notification-tx/services/room-notification-tx.service';
import { JOB_OPTIONS } from 'src/shared/constants';
import { QUEUE_JOB, QUEUE_NAME } from 'src/shared/constants/queue.constant';
import { UserSettingService } from 'src/user-setting/services/user-setting.service';
import { UserWalletService } from 'src/user-wallet/services/user-wallet.service';

import { GetChatQueueDataInput as SendChatQueueDataInput } from '../dtos/get-chat-queue-data-input.dto';

@Injectable()
export class ChatHelperService {
  constructor(
    private readonly userSettingService: UserSettingService,
    @Inject(forwardRef(() => ChatRoomService))
    private readonly chatRoomService: ChatRoomService,
    @Inject(forwardRef(() => UserWalletService))
    private readonly userWalletService: UserWalletService,
    private readonly networkService: NetworkService,
    @Inject(forwardRef(() => MessageService))
    private readonly messageService: MessageService,
    private readonly roomNotificationTxService: RoomNotificationTxService,
    private readonly roomActionTxService: RoomActionTxService,
    @InjectQueue(QUEUE_NAME.CHAT)
    private readonly chatQueue: Queue,
  ) {}

  async getDataForChatQueue({
    fromUserId,
    fromWalletAddress,
    roomId,
  }: Partial<SendChatQueueDataInput>): Promise<{
    networkId: number;
    fromWalletId: number;
    chatRoomId: number;
    feeAmount: number;
    isGroup: boolean;
  }> {
    const [userSetting, room, fromUserWallet] = await Promise.all([
      this.userSettingService.findOneByUserId(fromUserId),
      this.chatRoomService.findRoomById(roomId),
      this.userWalletService.findUserWalletByAddress(fromWalletAddress),
    ]);

    const canSendTransaction = await this.networkService.isSharedNetworks(
      room.networkId,
      fromUserWallet.networkId,
    );

    if (!canSendTransaction) {
      throw new BadRequestException(
        `Transaction can not be sent. Please check your network.`,
      );
    }

    const { feeAmount } = await this.networkService.getNetworkFeeByLevel(
      room.networkId,
      'fast', // ! Hardcode for testing only
      // input?.feeLevel ||  userSetting.gasFeeLevel || 'fast',
    );

    return {
      networkId: room.networkId,
      fromWalletId: fromUserWallet.id,
      chatRoomId: room.id,
      feeAmount,
      isGroup: room.isGroup,
    };
  }

  async sendChatQueueData(input: SendChatQueueDataInput): Promise<void> {
    const { networkId, fromWalletId, chatRoomId, feeAmount } =
      await this.getDataForChatQueue(input);

    /**
     * With add/remove members,we should create an array of room_notification_tx
     * With change room name, we should create room_action_tx
     */

    let messageId = 0;

    switch (input.jobName) {
      case QUEUE_JOB.CHAT.LEAVE_ROOM:
        {
          const newNotificationMessage =
            await this.messageService.createNotificationMessage({
              chatRoomId,
              content: input.messageContents?.[0] || '',
              userId: input.fromUserId,
              walletAddress: input.fromWalletAddress,
            });
          await this.roomNotificationTxService.createOne({
            chatRoomId,
            type: input.jobName,
            walletAddress: input.fromWalletAddress,
            messageId: newNotificationMessage.id,
          });
          messageId = newNotificationMessage.id;
        }
        break;
      case QUEUE_JOB.CHAT.CHANGE_GROUP_NAME:
      case QUEUE_JOB.CHAT.CREATE_GROUP_CHAT:
      case QUEUE_JOB.CHAT.REDEPLOY_GROUP_CHAT:
        {
          if (input.jobName === QUEUE_JOB.CHAT.REDEPLOY_GROUP_CHAT) {
            input.jobName = QUEUE_JOB.CHAT.CREATE_GROUP_CHAT;
          }
          const newRoomActionMessage =
            await this.messageService.createActionTypeMessage({
              chatRoomId,
              content: input.messageContents?.[0] || '',
              userId: input.fromUserId,
              walletAddress: input.fromWalletAddress,
            });
          await this.roomActionTxService.createOne({
            chatRoomId,
            data: input?.data || '',
            messageId: newRoomActionMessage.id,
            type: input.jobName,
            walletAddress: input.fromWalletAddress,
          });
          messageId = newRoomActionMessage.id;
        }
        break;
      case QUEUE_JOB.CHAT.REMOVE_MEMBERS:
      case QUEUE_JOB.CHAT.ACCEPT_JOIN_GROUP:
        {
          const newNotificationMessage =
            await this.messageService.createNotificationMessage({
              chatRoomId,
              content: '',
              userId: input.fromUserId,
              walletAddress: input.fromWalletAddress,
            });
          await Promise.all([
            input.toWalletAddresses.map(async (address) => {
              return this.roomNotificationTxService.createOne({
                chatRoomId,
                type: input.jobName,
                walletAddress: address,
                messageId: newNotificationMessage.id,
              });
            }),
          ]);
          messageId = newNotificationMessage.id;
        }
        break;
      case QUEUE_JOB.CHAT.SET_ADMIN:
      case QUEUE_JOB.CHAT.REMOVE_ADMIN:
        {
          const newNotificationMessage =
            await this.messageService.createNotificationMessage({
              chatRoomId,
              content: '',
              userId: input.fromUserId,
              walletAddress: input.fromWalletAddress,
            });
          await Promise.all([
            input.toWalletAddresses.map(async (address) => {
              return this.roomNotificationTxService.createOne({
                chatRoomId,
                type: input.jobName,
                walletAddress: address,
                messageId: newNotificationMessage.id,
              });
            }),
          ]);
          messageId = newNotificationMessage.id;
        }
        break;
      default:
        console.error('Job name not found');
    }

    this.chatQueue.add(
      {
        type: input.jobName,
        payload: {
          networkId,
          fromWalletId,
          chatRoomId,
          feeAmount,
          toAddresses: input.toWalletAddresses,
          messageId: input?.messageId || messageId,
          data: input?.data || '',
          tokenAmount: input?.tokenAmount || 0,
          tokenDecimal: input?.tokenDecimal || 18,
        },
      },
      JOB_OPTIONS,
    );
  }
}
