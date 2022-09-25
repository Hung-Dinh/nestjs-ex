import { InjectQueue } from '@nestjs/bull';
import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bull';
import { plainToClass } from 'class-transformer';
import { ChatRoom } from 'src/chat-room/entities/chat-room.entity';
import { ChatRoomService } from 'src/chat-room/services/chat-room.service';
import { SendNotificationService } from 'src/chat-room/services/send-notification.service';
import { FileService } from 'src/file/services/file.service';
import { MemberInRoomService } from 'src/member-in-room/services/member-in-room.service';
import { NetworkService } from 'src/network/services/network.service';
import { RoomKeyService } from 'src/room-key/services/room-key.service';
import { BlockchainService } from 'src/shared/blockchain-service/blockchain-service.service';
import { ChatHelperService } from 'src/shared/chat-helper/services/chat-helper.service';
import {
  CHAT_ROOM_STATUS,
  DISPLAY_ON_MY_SELF,
  IN_CHAT_NOTIFICATION_MID_CONTENT,
  MAX_MESSAGE_LENGTH,
  MEMBER_IN_ROOM_STATUS,
  MESSAGE_FILE_TYPE,
  MESSAGE_STATUS,
  MESSAGE_TYPE,
  SOCKET_TYPE,
} from 'src/shared/constants';
import { NETWORK_CHAINS } from 'src/shared/constants/network-mapping.constant';
import { QUEUE_JOB, QUEUE_NAME } from 'src/shared/constants/queue.constant';
import { TFileInfo } from 'src/shared/dtos/file-message-info.dto';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { DiffeHellmanTool } from 'src/shared/tools/diffe-hellman.tool';
import { NumberTool } from 'src/shared/tools/number.tool';
import {
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from 'src/transaction/constants/transaction.constant';
import { Transaction } from 'src/transaction/entities/transaction.entity';
import { TransactionService } from 'src/transaction/services/transaction.service';
import { UserService } from 'src/user/services/user.service';
import { UserContactService } from 'src/user-contact/services/user-contact.service';
import { UserTokenService } from 'src/user-token/services/user-token.service';
import { UserWalletService } from 'src/user-wallet/services/user-wallet.service';
import { getManager, In, Like, MoreThan, MoreThanOrEqual, Not } from 'typeorm';

import { CreateFileMessageInput } from '../dtos/create-file-message-input.dto';
import { CreateNotificationMessageInput } from '../dtos/create-notification-message-input.dto';
import { EncryptMessageInput } from '../dtos/encrypt-message-input.dto';
import { GetRoomFilesParamsDto } from '../dtos/get-room-files-params.dto';
import { MessageOutput } from '../dtos/message-output.dto';
import { SendMessageInput } from '../dtos/send-message-input.dto';
import { SendTokenChatInput } from '../dtos/send-token-chat-input.dto';
import { Message } from '../entities/message.entity';
import { MessageRepository } from '../respositories/message.repository';

@Injectable()
export class MessageService {
  constructor(
    private readonly logger: AppLogger,
    private readonly userService: UserService,
    private readonly repository: MessageRepository,
    @Inject(forwardRef(() => RoomKeyService))
    private readonly roomKeyService: RoomKeyService,
    @Inject(forwardRef(() => ChatRoomService))
    private readonly chatRoomService: ChatRoomService,
    private readonly messageRepostiory: MessageRepository,
    private readonly userContactService: UserContactService,
    @Inject(forwardRef(() => MemberInRoomService))
    private readonly memberInRoomService: MemberInRoomService,
    private readonly networkService: NetworkService,
    @Inject(forwardRef(() => ChatHelperService))
    private readonly chatHelperService: ChatHelperService,
    private readonly sendNotificationService: SendNotificationService,
    private blockchainService: BlockchainService,
    private userTokenService: UserTokenService,
    private transactionService: TransactionService,
    @Inject(forwardRef(() => UserWalletService))
    private readonly userWalletService: UserWalletService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @InjectQueue(QUEUE_NAME.ENCRYPT_FILE)
    private readonly encryptFileQueue: Queue,
  ) {
    this.logger.setContext(MessageService.name);
  }

  async getMessageAuthorInfo(
    requestUserId: number,
    messageAuthorId: number,
    messageAuthorAddress: string,
  ): Promise<any> {
    const [user, userContact] = await Promise.all([
      this.userService.findUserByUserId(messageAuthorId),
      this.userContactService.findUserContactByAddress(
        requestUserId,
        messageAuthorAddress,
      ),
    ]);

    let avatar = '';
    if (userContact?.avatar && NumberTool.isStringNumber(userContact.avatar)) {
      avatar = await this.fileService.getFileUrl(+userContact.avatar);
    } else if (user?.avatar && NumberTool.isStringNumber(user.avatar)) {
      avatar = await this.fileService.getFileUrl(+user.avatar);
    }

    return {
      userAvatar: avatar,
      displayName: userContact?.name || user?.name,
    };
  }

  async addAuthorInfoToMessage(
    requestUserId: number,
    message: Message,
  ): Promise<MessageOutput> {
    const { userId, walletAddress } = message;
    const { userAvatar, displayName } = await this.getMessageAuthorInfo(
      requestUserId,
      userId,
      walletAddress,
    );
    return plainToClass(
      MessageOutput,
      {
        ...message,
        userAvatar,
        displayName,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async addAuthorInfoToMessages(
    requestUserId: number,
    messages: Message[],
  ): Promise<MessageOutput[]> {
    return Promise.all(
      messages.map(async (message: Message) => {
        if (message.type !== MESSAGE_TYPE.ROOM_NOTIFICATION) {
          return this.addAuthorInfoToMessage(requestUserId, message);
        }
        return plainToClass(MessageOutput, message);
      }),
    );
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async countNumberOfMessageWithConditions(conditions: any): Promise<number> {
    return this.messageRepostiory.count({
      where: conditions,
    });
  }

  async getLatestMessageByRoomId(roomId: number): Promise<Message> {
    return this.messageRepostiory.findOne({
      where: {
        chatRoomId: roomId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async createNotificationMessage(
    input: CreateNotificationMessageInput,
  ): Promise<Message> {
    const newNotificationMessage = plainToClass(Message, {
      status: MESSAGE_STATUS.IN_PROGRESS,
      type: MESSAGE_TYPE.ROOM_NOTIFICATION,
      ...input,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryAt: new Date(),
    });
    return this.repository.save(newNotificationMessage);
  }

  async createActionTypeMessage(
    input: CreateNotificationMessageInput,
  ): Promise<Message> {
    const newActionTypeMessage = plainToClass(Message, {
      type: MESSAGE_TYPE.ROOM_ACTION,
      status: MESSAGE_STATUS.IN_PROGRESS,
      ...input,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryAt: new Date(),
    });

    return this.repository.save(newActionTypeMessage);
  }

  async createSystemMessage(
    input: CreateNotificationMessageInput,
  ): Promise<Message> {
    const newNotificationMessage = plainToClass(Message, {
      status: MESSAGE_STATUS.IN_PROGRESS,
      type: MESSAGE_TYPE.SYSTEM,
      ...input,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryAt: new Date(),
    });
    return this.repository.save(newNotificationMessage);
  }

  async pinMessageById(ctx: RequestContext, id: number): Promise<void> {
    this.logger.log(ctx, `${this.pinMessageById.name} was called`);
    const userId = ctx.user.id;

    const message = await this.repository.getMessageById(id);
    if (!message) {
      throw new Error('Message not found!');
    }

    const joinedMembers = await this.memberInRoomService.getJoinedMembersInRoom(
      message.chatRoomId,
    );
    if (!joinedMembers || !joinedMembers.find((x) => x.userId == userId)) {
      throw new Error('Member not in group!');
    }

    const room = await this.chatRoomService.getRoomById(message.chatRoomId);

    const newUpdatedMessage: Message = {
      ...message,
      isPinned: true,
      updatedAt: new Date(),
    };
    this.logger.log(ctx, `calling ${MessageRepository.name}.update message`);
    await this.repository.update(newUpdatedMessage.id, newUpdatedMessage);

    //send socket
    for (let i = 0; i < joinedMembers.length; i++) {
      await this.sendNotificationService.addNotificationToQueue(ctx, {
        userId: joinedMembers[i].userId,
        type: SOCKET_TYPE.PIN_MESSAGE,
        data: {
          isPinned: '1',
          roomId: message.chatRoomId.toString(),
          messageId: message.id.toString(),
          action: QUEUE_JOB.CHAT.PIN_MESSAGE,
          isNotSendFcm: '1',
        },
        notification: {
          title: room.name,
          body: `A message 's pinned`,
        },
      });
    }
  }

  async unpinMessageById(ctx: RequestContext, id: number): Promise<void> {
    this.logger.log(ctx, `${this.unpinMessageById.name} was called`);
    const userId = ctx.user.id;

    const message = await this.repository.getMessageById(id);
    if (!message) {
      throw new Error('Message not found!');
    }

    const joinedMembers = await this.memberInRoomService.getJoinedMembersInRoom(
      message.chatRoomId,
    );
    if (!joinedMembers || !joinedMembers.find((x) => x.userId == userId)) {
      throw new Error('Member not in group!');
    }

    const room = await this.chatRoomService.getRoomById(message.chatRoomId);

    const newUpdatedMessage: Message = {
      ...message,
      isPinned: false,
      updatedAt: new Date(),
    };
    this.logger.log(ctx, `calling ${MessageRepository.name}.update message`);
    await this.repository.update(newUpdatedMessage.id, newUpdatedMessage);

    //send socket
    for (let i = 0; i < joinedMembers.length; i++) {
      await this.sendNotificationService.addNotificationToQueue(ctx, {
        userId: joinedMembers[i].userId,
        type: SOCKET_TYPE.PIN_MESSAGE,
        data: {
          isPinned: '0',
          roomId: message.chatRoomId.toString(),
          messageId: message.id.toString(),
          action: QUEUE_JOB.CHAT.UNPIN_MESSAGE,
          isNotSendFcm: '1',
        },
        notification: {
          title: room.name,
          body: `A message 's unpinned`,
        },
      });
    }
  }

  async getPinnedMessages(
    ctx: RequestContext,
    roomId: number,
    limit: number,
    offset: number,
  ): Promise<{
    messages: MessageOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.getPinnedMessages.name} was called`);

    const userId = ctx.user.id;
    const member = await this.memberInRoomService.findJoinedMemberByUserId(
      userId,
      roomId,
    );

    if (!member) {
      throw new Error('User not joined to the room!');
    }

    const conditions = [
      { key: 'chatRoomId', condition: `= ${roomId}` },
      {
        key: 'isPinned',
        condition: ` > 0`,
      },
    ];
    const GET_PINNED_MESSAGE_QUERY = this.getRoomMessageQuery({
      roomId,
      conditions,
      userId,
      limit,
      offset,
    });
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const messagesOutput = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    let messagesOutput = await entityManager.query(GET_PINNED_MESSAGE_QUERY);
    console.log('messagesOutput', messagesOutput);

    messagesOutput = await Promise.all(
      messagesOutput.map(async (e) =>
        this.normalizeAndAttachFieldsValuesToMessage(e),
      ),
    );

    const count = messagesOutput.length;

    return {
      messages: plainToClass(MessageOutput, <any[]>messagesOutput, {
        excludeExtraneousValues: true,
      }),
      count: count,
    };
  }

  async getRoomMessages(
    ctx: RequestContext,
    roomId: number,
    limit: number,
    offset: number,
  ): Promise<{
    messages: MessageOutput[];
    unreadMessageCount: number;
    count: number;
  }> {
    this.logger.log(ctx, `${this.getRoomMessages.name} was called`);
    const userId = ctx.user.id;
    const member = await this.memberInRoomService.findJoinedMemberByUserId(
      userId,
      roomId,
    );

    if (!member) {
      throw new Error('User not joined to the room!');
    }

    const messageConditions = [
      {
        chatRoomId: roomId,
        userId: ctx.user.id,
        status: In([
          MESSAGE_STATUS.IN_PROGRESS,
          MESSAGE_STATUS.FAILED,
          MESSAGE_STATUS.COMPLETED,
        ]),
        createdAt: MoreThanOrEqual(member.createdAt),
        type: Not(MESSAGE_TYPE.SYSTEM),
      },
      {
        chatRoomId: roomId,
        userId: Not(ctx.user.id),
        status: MESSAGE_STATUS.COMPLETED,
        createdAt: MoreThanOrEqual(member.createdAt),
        type: Not(MESSAGE_TYPE.SYSTEM),
      },
    ];

    // only get in_progess and failed messsage if user is owner of them
    const [messages, count] = await this.messageRepostiory.findAndCount({
      where: messageConditions,
      take: limit,
      skip: offset,
      order: {
        createdAt: 'DESC',
      },
    });

    const countMessageCondition = [...messageConditions].map((condition) => {
      condition.createdAt = MoreThan(member.lastViewedAt);
      return condition;
    });
    const numberOfUnreadMessage = await this.countNumberOfMessageWithConditions(
      countMessageCondition,
    );
    const messagesOutput = await this.addAuthorInfoToMessages(
      ctx.user.id,
      messages,
    );

    return {
      messages: messagesOutput,
      unreadMessageCount: numberOfUnreadMessage,
      count,
    };
  }

  private getRoomMessageQuery({
    userId,
    offset,
    limit,
    conditions,
    roomId,
  }: {
    userId: number;
    offset?: number;
    limit?: number;
    roomId: number;
    conditions: {
      key: string;
      condition: string;
    }[];
  }): string {
    return `select distinct m.*, 
    if(m.userId = ${userId}, '${DISPLAY_ON_MY_SELF}', ifnull(uc.name, u.name)) as displayName,
    ifnull(uc.avatar, u.avatar) as userAvatar,
    t.toAddress, t.tokenSymbol, t.amount, t.networkId, t.txHash as sendTokenTxHash, 
    ifnull(rat.type, rnt.type) as notiType,
    (case when ifnull(rat.type, rnt.type) = '${
      QUEUE_JOB.CHAT.CREATE_GROUP_CHAT
    }' 
               then '${IN_CHAT_NOTIFICATION_MID_CONTENT.CREATED_THE_GROUP}'
          when ifnull(rat.type, rnt.type) = '${
            QUEUE_JOB.CHAT.REDEPLOY_GROUP_CHAT
          }' 
               then '${IN_CHAT_NOTIFICATION_MID_CONTENT.CREATED_THE_GROUP}'
          when ifnull(rat.type, rnt.type) = '${
            QUEUE_JOB.CHAT.CHANGE_GROUP_NAME
          }' 
               then '${IN_CHAT_NOTIFICATION_MID_CONTENT.CHANGED_GROUP_NAME_TO}'
          when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.LEAVE_ROOM}' 
               then '${IN_CHAT_NOTIFICATION_MID_CONTENT.LEFT_THE_GROUP}'
          when ifnull(rat.type, rnt.type) = '${
            QUEUE_JOB.CHAT.ACCEPT_JOIN_GROUP
          }' 
               then '${IN_CHAT_NOTIFICATION_MID_CONTENT.JOINED_THE_GROUP}'
          when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.REMOVE_MEMBERS}' 
               then '${IN_CHAT_NOTIFICATION_MID_CONTENT.REMOVED}'
          when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.SET_ADMIN}' 
               then '${IN_CHAT_NOTIFICATION_MID_CONTENT.SET_ADMIN_ROLE_TO}'
          when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.REMOVE_ADMIN}' 
               then '${
                 IN_CHAT_NOTIFICATION_MID_CONTENT.REMOVED_ADMIN_ROLE_FROM
               }'
     end) as notiMidContent,
    (case when ifnull(rat.type, rnt.type) = '${
      QUEUE_JOB.CHAT.CHANGE_GROUP_NAME
    }' 
               then rat.data
          when ifnull(rat.type, rnt.type) in ('${
            QUEUE_JOB.CHAT.REMOVE_MEMBERS
          }',
                                              '${
                                                QUEUE_JOB.CHAT.ACCEPT_JOIN_GROUP
                                              }',  
                                              '${QUEUE_JOB.CHAT.SET_ADMIN}', 
                                              '${
                                                QUEUE_JOB.CHAT.REMOVE_ADMIN
                                              }')  
               then   (
                       select if(u2.id = ${userId}, '${DISPLAY_ON_MY_SELF}' , ifnull(uc2.name, u2.name)) as data
                       from user_wallet uw
                       inner join users u2 on u2.id = uw.userId
                       left outer join user_contact uc2 on uc2.userId = ${userId} and lower(uc2.address) = lower(rnt.walletAddress)
                       where lower(uw.address) = lower(rnt.walletAddress)
                       limit 1)
     end) as notiEndContent,
     ifnull(rat.createdAt, rnt.createdAt) as notiCreatedAt
    from messages m
    left outer join transaction t on t.id = m.transactionId
    inner join users u on u.id = m.userId
    left outer join user_contact uc on uc.userId = ${userId} and lower(uc.address) = lower(m.walletAddress)
    left outer join room_action_tx rat on rat.messageId = m.id
    left outer join room_notification_tx rnt on rnt.messageId = m.id
    left outer join remove_message rm on rm.messageId = m.id and rm.userId = ${userId}
    where ${conditions
      .map(({ key, condition }) => `m.${key} ${condition}`)
      .join(' and ')} 
    and m.chatRoomId = ${roomId}
    and rm.id is null
    and if(m.userId = ${userId} 
           and m.type != '${MESSAGE_TYPE.ROOM_ACTION}' 
           and m.type != '${MESSAGE_TYPE.ROOM_NOTIFICATION}', 
      m.status != '${MESSAGE_STATUS.HIDDEN}', 
      m.status = '${MESSAGE_STATUS.COMPLETED}')
    order by m.createdAt desc, notiCreatedAt desc
    ${!isNaN(limit) ? `limit ${limit}` : ''}
    ${!isNaN(offset) ? `offset ${offset}` : ''}`;
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const messagesOutput = await slaveQueryRunner.query(sql);
  }

  private async attachUserAvatarToMessage(input: any) {
    const output = {
      ...input,
    };
    if (output?.userAvatar && NumberTool.isStringNumber(output.userAvatar)) {
      try {
        output.userAvatar = await this.fileService.getFileUrl(
          +output.userAvatar,
        );
      } catch (error) {
        console.error('[attachUserAvatar] error', error);
      }
    }

    return output;
  }

  private changeNotiContentOfAcceptJoinGroupMessage(input: any) {
    const output = { ...input };
    if (output.notiType == QUEUE_JOB.CHAT.ACCEPT_JOIN_GROUP) {
      output.userAvatar = null;
      output.displayName = output.notiEndContent;
      delete output.notiEndContent;
    }

    return output;
  }

  private nomarlizeMessageStatus(input: any) {
    const output = { ...input };
    if (
      output?.status &&
      [MESSAGE_STATUS.PENDING_RETRY, MESSAGE_STATUS.RETRYING].includes(
        output.status,
      )
    ) {
      output.status = MESSAGE_STATUS.IN_PROGRESS;
    }
    return output;
  }

  private async attachFileUrlToMessage(input: any) {
    const output = { ...input };

    if (
      output.content &&
      output?.type &&
      MESSAGE_FILE_TYPE.includes(output.type)
    ) {
      output.file = '';
      if (output.status === MESSAGE_STATUS.COMPLETED) {
        try {
          const { url } = await this.getFileMesageInfo(output.content);
          output.file = url;
        } catch (error) {
          console.error('[attachFileUrl] error', error);
        }
      }
      output.content = '';
    }
    return output;
  }

  private async normalizeSendTokenMessageAmount(input: any) {
    const output = { ...input };
    if (output.type == MESSAGE_TYPE.SEND_TOKEN && output.networkId) {
      const tokenList = await this.userTokenService.getAllTokenFromNetwork(
        output.networkId,
      );
      if (output.amount) {
        const token = tokenList.find(
          (x) =>
            x.tokenSymbol.toLowerCase() == output.tokenSymbol?.toLowerCase(),
        );
        if (token) {
          output.amount = this.blockchainService
            .formatPoint(output.amount, token.tokenDecimal)
            .toString();
        } else {
          output.amount = null;
        }
      }
    }
    return output;
  }

  private async normalizeAndAttachFieldsValuesToMessage(
    input: any,
  ): Promise<any> {
    let output = await this.attachUserAvatarToMessage(input);
    output = this.changeNotiContentOfAcceptJoinGroupMessage(output);
    output = this.nomarlizeMessageStatus(output);
    output = await this.attachFileUrlToMessage(output);
    output = await this.normalizeSendTokenMessageAmount(output);
    return output;
  }

  async getRoomMessagesNew(
    ctx: RequestContext,
    roomId: number,
    limit: number,
    offset: number,
  ): Promise<{
    messages: MessageOutput[];
    unreadMessageCount: number;
  }> {
    this.logger.log(ctx, `${this.getRoomMessages.name} was called`);
    const userId = ctx.user.id;
    const member = await this.memberInRoomService.findJoinedMemberByUserId(
      userId,
      roomId,
    );

    if (!member) {
      throw new Error('User not joined to the room!');
    }

    const countMessageCondition = [
      {
        chatRoomId: roomId,
        userId: ctx.user.id,
        status: In([
          MESSAGE_STATUS.IN_PROGRESS,
          MESSAGE_STATUS.PENDING_RETRY,
          MESSAGE_STATUS.RETRYING,
          MESSAGE_STATUS.FAILED,
          MESSAGE_STATUS.COMPLETED,
        ]),
        createdAt: MoreThan(member.lastViewedAt),
      },
      {
        chatRoomId: roomId,
        userId: Not(ctx.user.id),
        status: MESSAGE_STATUS.COMPLETED,
        createdAt: MoreThan(member.lastViewedAt),
      },
    ];

    const numberOfUnreadMessage = await this.countNumberOfMessageWithConditions(
      countMessageCondition,
    );

    const GET_ROOM_MESSAGE_QUERY = this.getRoomMessageQuery({
      userId,
      conditions: [{ key: 'chatRoomId', condition: `= ${roomId}` }],
      limit,
      offset,
      roomId,
    });
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const messagesOutput = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    let messagesOutput = await entityManager.query(GET_ROOM_MESSAGE_QUERY);

    messagesOutput = await Promise.all(
      messagesOutput.map(async (e) =>
        this.normalizeAndAttachFieldsValuesToMessage(e),
      ),
    );

    return {
      messages: plainToClass(MessageOutput, <any[]>messagesOutput, {
        excludeExtraneousValues: true,
      }),
      unreadMessageCount: numberOfUnreadMessage,
    };
  }

  async getFailedRoomNotifications(
    ctx: RequestContext,
    roomId: number,
    limit: number,
    offset: number,
  ): Promise<{
    messages: MessageOutput[];
  }> {
    this.logger.log(ctx, `${this.getFailedRoomNotifications.name} was called`);
    const userId = ctx.user.id;
    const checkAdmin = await this.memberInRoomService.isRoomOwnerOrAdmin(
      userId,
      roomId,
    );

    if (!checkAdmin) {
      return { messages: [] };
    }

    // only get failed ACCEPT_JOIN_GROUP and REMOVE_MEMBERS room_notification

    const sql = `Select rnt.type as notiType
    FROM messages m
    inner join room_notification_tx rnt on rnt.messageId = m.id 
               and rnt.id = (select max(id) from room_notification_tx where messageId = m.id)
               and rnt.id = (select max(id) from room_notification_tx where chatRoomId = m.chatRoomId and walletAddress = rnt.walletAddress)
    inner join member_in_room mir on mir.chatRoomId = m.chatRoomId and mir.walletAddress = rnt.walletAddress 
               and mir.id = (select max(id) from member_in_room mir2 where mir2.chatRoomId = m.chatRoomId  and mir2.walletAddress = rnt.walletAddress) 
    where m.type = '${MESSAGE_TYPE.ROOM_NOTIFICATION}'
    and m.status = '${MESSAGE_STATUS.FAILED}'
    and m.chatRoomId = ${roomId}
    and ((rnt.type = '${QUEUE_JOB.CHAT.ACCEPT_JOIN_GROUP}' and mir.status = '${MEMBER_IN_ROOM_STATUS.PENDING_APPROVAL}')
         or (rnt.type = '${QUEUE_JOB.CHAT.REMOVE_MEMBERS}' and mir.status = '${MEMBER_IN_ROOM_STATUS.JOINED}'))
    group by  rnt.type`;
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const messagesOutput = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const messagesOutput = await entityManager.query(sql);

    return {
      messages: plainToClass(MessageOutput, <any[]>messagesOutput, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async insertMessage(
    ctx: RequestContext,
    message: Record<string, any>,
  ): Promise<Record<string, any>> {
    const newMessage = plainToClass(Message, message);
    this.logger.log(ctx, `${this.messageRepostiory.save} was called`);
    return await this.messageRepostiory.save(newMessage);
  }

  async encryptMessage(
    ctx: RequestContext,
    input: EncryptMessageInput,
  ): Promise<string> {
    this.logger.log(ctx, `${this.encryptMessage.name} was called`);
    const userId = ctx.user.id;
    const { message, roomId } = input;

    const roomKey = await this.roomKeyService.findRoomKeyByUserIdAndRoomId(
      userId,
      roomId,
    );

    if (!roomKey) {
      throw new Error('Room key not found!');
    }

    const encryptedMessage = DiffeHellmanTool.encrypt(
      message,
      roomKey.sharedKey,
      roomKey.iv,
    );

    return encryptedMessage;
  }

  async decryptMessage(
    ctx: RequestContext,
    input: EncryptMessageInput,
  ): Promise<string> {
    this.logger.log(ctx, `${this.encryptMessage.name} was called`);
    const userId = ctx.user.id;
    const { message, roomId } = input;

    const roomKey = await this.roomKeyService.findRoomKeyByUserIdAndRoomId(
      userId,
      roomId,
    );

    if (!roomKey) {
      throw new Error('Room key not found!');
    }

    const encryptedMessage = DiffeHellmanTool.decrypt(
      {
        content: message,
        iv: roomKey.iv,
      },
      roomKey.sharedKey,
    );

    return encryptedMessage;
  }

  async getDeployedRoomById(chatRoomId: number): Promise<ChatRoom> {
    const room = await this.chatRoomService.getRoomById(chatRoomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status === CHAT_ROOM_STATUS.BLOCKED) {
      throw new Error('Room is blocked!');
    }
    if (room.status !== CHAT_ROOM_STATUS.DEPLOYED) {
      throw new Error('Room is not deployed or Room is paused!');
    }

    return room;
  }

  async sendMessage(
    ctx: RequestContext,
    userId: number,
    input: SendMessageInput,
  ): Promise<Message> {
    this.logger.log(ctx, `${this.sendMessage.name} was called`);
    const users = await this.getUserForSendMessage(userId);
    if (!users || users.length == 0) {
      throw new Error('User not found!');
    } else if (!users[0].address) {
      throw new Error('Default wallet not found!');
    } else if (!users[0].rpcEndpoint) {
      throw new Error('Default network not found!');
    } else if (!users[0].isEnableAutosignMessage) {
      throw new Error('Please enables Auto sign first!');
    }

    const room = await this.getDeployedRoomById(input.chatRoomId);

    const joinedMember =
      await this.memberInRoomService.findJoinedMemberByUserId(
        userId,
        input.chatRoomId,
      );

    if (!joinedMember) {
      throw new Error('User have not joined room!');
    }

    const user = users[0];
    if (!MESSAGE_TYPE[input.type.toUpperCase()]) {
      throw new Error('Message type is not valid!');
    }

    const numberOfTxs = Math.ceil(
      (input.content?.length || 1) / MAX_MESSAGE_LENGTH,
    );
    const newMessage = plainToClass(Message, {
      ...input,
      userId: user.id,
      walletAddress: user.address,
      isPinned: false,
      status: MESSAGE_STATUS.IN_PROGRESS,
      numberOfTxs,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryAt: new Date(),
    });
    const newCreatedMessage = await this.repository.save(newMessage);

    // const { chatRoomId, feeAmount, networkId, fromWalletId } =
    //   await this.chatHelperService.getDataForChatQueue({
    //     fromUserId: userId,
    //     fromWalletAddress: user.address,
    //     messageContents: [input.content],
    //     messageType: '',
    //     roomId: input.chatRoomId,
    //     toWalletAddresses: [],
    //   });

    if (room?.isGroup) {
      // const newJob = await this.chatQueue.add({
      //   type: QUEUE_JOB.CHAT.SEND_MESSAGE_TO_GROUP,
      //   payload: {
      //     chatRoomId,
      //     messageId: newCreatedMessage.id,
      //     networkId,
      //     fromWalletId,
      //     feeAmount,
      //   },
      // });
      // console.log(`newJob`, newJob);

      await this.chatHelperService.sendChatQueueData({
        fromUserId: userId,
        fromWalletAddress: user.address,
        messageContents: [input.content],
        messageType: '',
        roomId: input.chatRoomId,
        toWalletAddresses: [],
        jobName: QUEUE_JOB.CHAT.SEND_MESSAGE_TO_GROUP,
        messageId: newCreatedMessage.id,
      });
    } else {
      const otherMemberInRoom =
        await this.memberInRoomService.findOppositeMember(
          userId,
          input.chatRoomId,
        );
      await this.chatHelperService.sendChatQueueData({
        fromUserId: userId,
        fromWalletAddress: user.address,
        messageContents: [input.content],
        messageType: '',
        roomId: input.chatRoomId,
        toWalletAddresses: [otherMemberInRoom.walletAddress],
        jobName: QUEUE_JOB.CHAT.SEND_MESSSAGE_TO_PEER,
        messageId: newCreatedMessage.id,
      });
    }

    return newCreatedMessage;
    // return plainToClass(Message, newCreatedMessage, {
    //   excludeExtraneousValues: true,
    // });
  }

  async resendMessage(ctx: RequestContext, id: number): Promise<MessageOutput> {
    this.logger.log(ctx, `${this.resendMessage.name} was called`);
    this.logger.log(ctx, `calling ${MessageRepository.name}.getById`);
    const userId = ctx.user.id;
    const users = await this.getUserForSendMessage(userId);
    if (!users || users.length == 0) {
      throw new Error('User not found!');
    } else if (!users[0].address) {
      throw new Error('Default wallet not found!');
    } else if (!users[0].rpcEndpoint) {
      throw new Error('Default network not found!');
    } else if (!users[0].isEnableAutosignMessage) {
      throw new Error('Please enables Auto sign first!');
    }

    const oldMessage = await this.messageRepostiory.getMessageById(id);
    if (!oldMessage) {
      throw new NotFoundException('This message does not exist!');
    }
    if (oldMessage.status != MESSAGE_STATUS.FAILED) {
      throw new Error('This message is not deployed fail!');
    }
    if (oldMessage.userId != userId) {
      throw new Error('This message is not yours!');
    }

    const room = await this.getDeployedRoomById(oldMessage.chatRoomId);

    const newUpdatedMessage: Message = {
      ...oldMessage,
      status: MESSAGE_STATUS.IN_PROGRESS,
      updatedAt: new Date(),
      retryAt: new Date(),
    };

    this.logger.log(ctx, `calling ${MessageRepository.name}.update message`);
    await this.messageRepostiory.update(
      newUpdatedMessage.id,
      newUpdatedMessage,
    );

    if (
      oldMessage?.type &&
      MESSAGE_FILE_TYPE.includes(oldMessage.type) &&
      oldMessage?.content &&
      NumberTool.isStringNumber(oldMessage.content)
    ) {
      /**
        if content of old message is still a number (which is the fileId on files table) which means the file hasn't been uploaded to ipfs yet
        we have to try to upload it again instead of rebuilding the transaction
      */
      this.addToUploadFileQueue({
        messageId: oldMessage.id,
        chatRoomId: oldMessage.chatRoomId,
        userId,
        fileId: Number(oldMessage.content),
        userWalletAddress: users[0].address,
      });
      return;
    }

    if (room?.isGroup) {
      await this.chatHelperService.sendChatQueueData({
        fromUserId: userId,
        fromWalletAddress: newUpdatedMessage.walletAddress,
        messageContents: [newUpdatedMessage.content],
        messageType: '',
        roomId: newUpdatedMessage.chatRoomId,
        toWalletAddresses: [],
        jobName: QUEUE_JOB.CHAT.SEND_MESSAGE_TO_GROUP,
        messageId: newUpdatedMessage.id,
      });
    } else {
      const otherMemberInRoom =
        await this.memberInRoomService.findOppositeMember(
          userId,
          newUpdatedMessage.chatRoomId,
        );
      await this.chatHelperService.sendChatQueueData({
        fromUserId: userId,
        fromWalletAddress: newUpdatedMessage.walletAddress,
        messageContents: [newUpdatedMessage.content],
        messageType: '',
        roomId: newUpdatedMessage.chatRoomId,
        toWalletAddresses: [otherMemberInRoom.walletAddress],
        jobName: QUEUE_JOB.CHAT.SEND_MESSSAGE_TO_PEER,
        messageId: newUpdatedMessage.id,
      });
    }

    return plainToClass(MessageOutput, newUpdatedMessage, {
      excludeExtraneousValues: true,
    });
  }

  async getUserForSendMessage(userId: number) {
    const sql = `select u.id, u.name as displayName, uw.address, 
    n.rpcEndpoint , us.isEnableAutosignMessage, us.gasFeeLevel 
    from users u
    inner join user_setting us on us.userId = u.id
    left join user_wallet uw on uw.id = us.useUserWalletId
    left join network n on n.id = us.useNetworkId 
    where u.id = ${userId}`;
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // return await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    return entityManager.query(sql);
  }

  async getMessageById(
    ctx: RequestContext,
    id: number,
  ): Promise<MessageOutput> {
    this.logger.log(ctx, `${this.getMessageById} was called`);
    const userId = ctx.user.id;
    const message = await this.messageRepostiory.findOne(id);
    const member = await this.memberInRoomService.findJoinedMemberByUserId(
      userId,
      message.chatRoomId,
    );
    if (!member) {
      throw new Error('User is not in room');
    }

    const GET_MESSAGE_BY_ID_QUERY = this.getRoomMessageQuery({
      userId,
      roomId: message.chatRoomId,
      conditions: [
        {
          key: 'chatRoomId',
          condition: `= ${message.chatRoomId}`,
        },
        {
          key: 'id',
          condition: `= ${message.id}`,
        },
      ],
    });

    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const messagesOutputs = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const messagesOutputs = await entityManager.query(GET_MESSAGE_BY_ID_QUERY);

    if (!messagesOutputs || !messagesOutputs.length) {
      throw new Error('Message not found');
    }
    let messageOutput = messagesOutputs[0];

    messageOutput = await this.normalizeAndAttachFieldsValuesToMessage(
      messageOutput,
    );

    return plainToClass(MessageOutput, messageOutput, {
      excludeExtraneousValues: true,
    });
  }

  async findCreateRoomMessage(chatRoomId: number): Promise<Message> {
    const message = await this.messageRepostiory.findOne({
      where: {
        chatRoomId,
        type: MESSAGE_TYPE.SYSTEM,
        content: Like('%create%'),
      },
    });
    return message;
  }

  async retrieveMessage(
    ctx: RequestContext,
    userId: number,
    id: number,
  ): Promise<void> {
    const message = await this.messageRepostiory.findOne(id);

    if (message['userId'] != userId) {
      throw new Error('Message  is not execute permission');
    }
    this.logger.log(ctx, `${this.retrieveMessage.name} was called`);
    await this.repository
      .createQueryBuilder()
      .update()
      .set({
        status: MESSAGE_STATUS.HIDDEN,
      })
      .where('id =:id', { id: id })
      .execute();

    const roomId = message['chatRoomId'];
    const listMember = await this.memberInRoomService.findRoomMember(
      roomId,
      MEMBER_IN_ROOM_STATUS.JOINED,
    );

    await Promise.all(
      listMember.map(async (e) => {
        await this.sendNotificationService.addNotificationToQueue(ctx, {
          userId: e.userId,
          type: SOCKET_TYPE.MESSAGE_RETRIEVE,
          data: {
            status: MESSAGE_STATUS.HIDDEN,
            roomId: roomId.toString(),
            messageId: id.toString(),
            action: QUEUE_JOB.CHAT.RETRIVE_MESSAGE,
            isNotSendFcm: '1',
          },
          notification: {
            title: 'Message retrieved',
            body: `has hide message to group `,
          },
        });
      }),
    );
  }

  async sendRedpacket(
    ctx: RequestContext,
    userId: number,
    input: SendTokenChatInput,
  ): Promise<Message> {
    this.logger.log(ctx, `${this.sendRedpacket.name} was called`);

    const users = await this.getUserForSendMessage(userId);
    if (!users || users.length == 0) {
      throw new Error('User not found!');
    } else if (!users[0].address) {
      throw new Error('Default wallet not found!');
    } else if (!users[0].rpcEndpoint) {
      throw new Error('Default network not found!');
    } else if (!users[0].isEnableAutosignMessage) {
      throw new Error('Please enables Auto sign first!');
    }

    const room = await this.getDeployedRoomById(input.chatRoomId);

    const joinedMember =
      await this.memberInRoomService.findJoinedMemberByUserId(
        userId,
        input.chatRoomId,
      );

    if (!joinedMember) {
      throw new Error('User have not joined room!');
    }

    const user = users[0];

    const userWallet =
      await this.userWalletService.findUserWalletByAddressAndUserId(
        user.address,
        userId,
      );

    if (!userWallet) {
      throw new NotFoundException('User wallet not found');
    }

    const inputNetwork = await this.networkService.findNetworkById(
      input.networkId,
    );
    console.log('input.networkId', input.networkId);
    console.log('inputNetwork', inputNetwork);
    if (!inputNetwork) {
      throw new Error('Network is not valid');
    }

    if (
      !NETWORK_CHAINS.eurus ||
      !NETWORK_CHAINS.eurus.find((x) => x == inputNetwork.chainId)
    ) {
      throw new Error('This network does not support Send Red Packet');
    }

    if (userWallet.networkId != input.networkId) {
      if (
        !this.networkService.isSharedNetworks(
          inputNetwork.id,
          userWallet.networkId,
        )
      ) {
        throw new Error('Network is not valid');
      }
    }

    const checkValidtoAddress = await this.blockchainService.isValidAddress(
      input.toAddress,
    );
    if (!checkValidtoAddress) {
      throw new Error('Invalid inbound address');
    }

    const receiveMember =
      await this.memberInRoomService.findInvitedOrJoinedMemberByAddress(
        input.toAddress,
        input.chatRoomId,
      );

    if (!receiveMember) {
      throw new Error('Receive person have not joined this room!');
    }

    const token = await this.userTokenService.getTokenById(input.tokenId);
    if (!token || token.networkId != input.networkId) {
      throw new NotFoundException('Token not found');
    }

    const newTransaction = plainToClass(Transaction, {
      ...input,
      userId,
      userWalletId: userWallet.id,
      fromAddress: user.address,
      memoCode: null,
      txHash: null,
      blockchainTxId: null,
      transactionStatus: TRANSACTION_STATUS.PENDING,
      type: TRANSACTION_TYPE.WITHDRAW_RED_PACKET,
      amount: this.transactionService.calcRawAmountOfTransaction(
        input.amount,
        token.tokenDecimal,
      ),
      tokenSymbol: token.tokenSymbol,
      tokenAddress: token.tokenAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('newTransaction', newTransaction);

    const newTransactionDb = await this.transactionService.saveTransaction(
      newTransaction,
    );

    const newMessage = plainToClass(Message, {
      chatRoomId: input.chatRoomId,
      userId: user.id,
      walletAddress: user.address,
      isPinned: false,
      status: MESSAGE_STATUS.IN_PROGRESS,
      type: MESSAGE_TYPE.SEND_TOKEN,
      transactionId: newTransactionDb.id,
      numberOfTxs: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryAt: new Date(),
    });

    const newCreatedMessage = await this.repository.save(newMessage);
    await this.chatHelperService.sendChatQueueData({
      fromUserId: userId,
      fromWalletAddress: user.address,
      messageContents: undefined,
      messageType: MESSAGE_TYPE.SEND_TOKEN,
      roomId: input.chatRoomId,
      toWalletAddresses: [input.toAddress],
      jobName: QUEUE_JOB.CHAT.SEND_RED_PACKET,
      messageId: newCreatedMessage.id,
      feeLevel: input.feeLevel,
      transactionId: newTransactionDb.id,
      tokenAmount: input.amount,
      tokenDecimal: token.tokenDecimal,
    });

    return newCreatedMessage;
  }

  async findMessageByTransactionId(transactionId: number): Promise<Message> {
    return this.repository.findOne({
      where: {
        transactionId,
      },
    });
  }

  async findMessagesByIds(ids: number[]): Promise<Message[]> {
    return this.repository.find({
      where: {
        id: In(ids),
      },
    });
  }

  async findMessagesByTransactionIds(
    transactionIds: number[],
  ): Promise<Message[]> {
    return this.repository.find({
      where: {
        transactionId: In(transactionIds),
      },
    });
  }

  async createFileMessage(
    ctx: RequestContext,
    input: CreateFileMessageInput,
    file: Express.Multer.File,
  ): Promise<Message> {
    this.logger.log(ctx, `${this.createFileMessage.name} was called`);

    const userId = ctx.user.id;
    const users = await this.getUserForSendMessage(userId);

    this.checkIfUserIsAbleToSendTx(users);
    await this.checkIfRoomIsDeployedAndInSupportedNetwork(input.chatRoomId);
    await this.checkIfUserJoinedRoom(userId, input.chatRoomId);

    const user = users[0];

    /**
     * Upload file to s3 first. This is unencrypted version of file.
     */
    const newFileId = await this.fileService.createFile(
      ctx,
      file,
      `chat-rooms/${input.chatRoomId}/users/${userId}`,
    );
    let fileInfo: any = {};
    try {
      fileInfo = (input?.fileInfo && JSON.parse(input.fileInfo)) || {};
    } catch (error) {
      console.error(`passing file info error`, input?.fileInfo);
    }

    const newMessage = plainToClass(Message, {
      ...input,
      userId: user.id,
      walletAddress: user.address,
      isPinned: false,
      status: MESSAGE_STATUS.IN_PROGRESS,
      numberOfTxs: 1,
      content: newFileId,
      retryAt: new Date(),
      type: fileInfo?.type || MESSAGE_TYPE.FILE,
    });
    const newDbMessage = await this.repository.save(newMessage);

    this.addToUploadFileQueue({
      messageId: newDbMessage.id,
      chatRoomId: input.chatRoomId,
      userId,
      fileId: newFileId,
      userWalletAddress: user.address,
    });

    return newDbMessage;
  }

  private async addToUploadFileQueue({
    chatRoomId,
    fileId,
    messageId,
    userId,
    userWalletAddress,
  }: {
    userId: number;
    userWalletAddress: string;
    chatRoomId: number;
    messageId: number;
    fileId: number;
  }): Promise<any> {
    const { feeAmount, fromWalletId, networkId, isGroup } =
      await this.chatHelperService.getDataForChatQueue({
        fromUserId: userId,
        fromWalletAddress: userWalletAddress,
        roomId: chatRoomId,
      });
    const receiversAddresses = await this.getReceiversAddresses(
      userId,
      chatRoomId,
      isGroup,
    );

    this.encryptFileQueue.add({
      messageId,
      chatRoomId,
      fileId,
      userId,
      networkId,
      fromWalletId,
      feeAmount,
      messageJob: isGroup
        ? QUEUE_JOB.CHAT.SEND_MESSAGE_TO_GROUP
        : QUEUE_JOB.CHAT.SEND_MESSSAGE_TO_PEER,
      toWalletAddresses: receiversAddresses,
    });
  }

  private async getReceiversAddresses(
    currentUserId: number,
    chatRoomId: number,
    isGroup: boolean,
  ): Promise<string[]> {
    if (isGroup) return [];

    const otherMemberInRoom = await this.memberInRoomService.findOppositeMember(
      currentUserId,
      chatRoomId,
    );
    return [otherMemberInRoom.walletAddress];
  }

  private checkIfUserIsAbleToSendTx(users: any) {
    const user = users?.length > 0 && users[0];

    if (!user) {
      throw new Error('User not found!');
    }

    if (!user.address) {
      throw new Error('Default wallet not found!');
    }

    if (!user.rpcEndpoint) {
      throw new Error('Default network not found!');
    }

    if (!user.isEnableAutosignMessage) {
      throw new Error('Please enables Auto sign first!');
    }
  }

  private async checkIfRoomIsDeployedAndInSupportedNetwork(roomId: number) {
    const room = await this.chatRoomService.getRoomById(roomId);
    if (room.status !== CHAT_ROOM_STATUS.DEPLOYED) {
      throw new Error('Room is not deployed or Room is paused!');
    }
    console.log('room.networkId', room.networkId);
    const isNetworkUsedOnChat = await this.networkService.isNetworkUsedOnChat(
      room.networkId,
    );
    if (!isNetworkUsedOnChat) {
      throw new Error(
        'The current network is not supported. Please make sure you are using the correct network',
      );
    }
  }

  private checkIfUserJoinedRoom = async (userId: number, roomId: number) => {
    const joinedMember =
      await this.memberInRoomService.findJoinedMemberByUserId(userId, roomId);
    if (!joinedMember) {
      throw new Error('User have not joined room!');
    }
  };

  async getFileMesageInfo(messageContent: string): Promise<TFileInfo> {
    if (messageContent.startsWith('http')) {
      return this.fileService.getFileInfoByIpfsUrl(messageContent);
    }

    /**
     * In case message hasn't been processed by queue yet
     */
    return this.fileService.getFileInfoByFileId(parseInt(messageContent));
  }

  async getFileMessages(
    ctx: RequestContext,
    params: GetRoomFilesParamsDto,
  ): Promise<MessageOutput[]> {
    const conditions = [
      { key: 'chatRoomId', condition: `= ${params.roomId}` },
      {
        key: 'type',
        condition: `in (${params.types.map((e) => `'${e}'`).join(',')})`,
      },
      {
        key: 'status',
        condition: `= "${MESSAGE_STATUS.COMPLETED}"`,
      },
    ];
    const GET_ROOM_MESSAGE_QUERY = this.getRoomMessageQuery({
      userId: ctx.user.id,
      conditions,
      offset: params.offset,
      limit: params.limit,
      roomId: params.roomId,
    });
    let roomFiles = await this.repository.query(GET_ROOM_MESSAGE_QUERY);

    roomFiles = await Promise.all(
      roomFiles.map(async (roomFile) =>
        this.normalizeAndAttachFieldsValuesToMessage(roomFile),
      ),
    );
    return roomFiles;
  }

  async findMessageById(id: number): Promise<Message> {
    return await this.repository.getMessageById(id);
  }
}
