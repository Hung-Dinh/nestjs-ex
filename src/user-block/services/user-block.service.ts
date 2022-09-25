import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { FileService } from 'src/file/services/file.service';
import { CHAT_ROOM_STATUS } from 'src/shared/constants';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/services/user.service';
import { UserContact } from 'src/user-contact/entities/user-contact.entity';
import { UserContactService } from 'src/user-contact/services/user-contact.service';
import { UserWalletService } from 'src/user-wallet/services/user-wallet.service';
import { Connection, EntityManager, getManager, In } from 'typeorm';

import { ChatRoom } from '../../chat-room/entities/chat-room.entity';
import { BlockInput } from '../dtos/block-unblock-input.dto';
import { UnblockInput } from '../dtos/unblock-input.dto';
import { BlockedUserOutput } from '../dtos/user-block-list-output.dto';
import { UserBlock } from '../entities/user-block.entity';
import { UserBlockRepository } from '../repositories/user-block.repository';

@Injectable()
export class UserBlockService {
  constructor(
    private readonly logger: AppLogger,
    private readonly userBlockRepository: UserBlockRepository,
    private readonly userService: UserService,
    private readonly userContactService: UserContactService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    private readonly connection: Connection,
    @Inject(forwardRef(() => UserWalletService))
    private readonly userWalletService: UserWalletService,
  ) {}

  private async getBlockedUserInfos(
    blockedUserIds: number[],
  ): Promise<Partial<User>[]> {
    return this.userService.findList({
      where: {
        id: In(blockedUserIds),
      },
      select: ['id', 'name', 'avatar'],
    });
  }

  private async getUserContacts(
    userId: number,
    blockedWalletAddresses: string[],
  ): Promise<Partial<UserContact>[]> {
    return this.userContactService.findUserContactsByAddressList(
      userId,
      blockedWalletAddresses,
    );
  }

  private attachUserContactInfo(
    input: BlockedUserOutput,
    users: Partial<User>[],
    userContacts: Partial<UserContact>[],
  ): BlockedUserOutput {
    let output = { ...input, avatar: '' };
    const user = users.find((u: Partial<User>) => u.id === input.userId);
    if (!user) return output;
    output.avatar = user?.avatar || '';
    output.name = user?.name || '';

    const userContact = userContacts?.find(
      (u: Partial<UserContact>) => u.address === input.address,
    );
    if (userContact) {
      output = {
        ...output,
        avatar: userContact?.avatar ? userContact.avatar : output.avatar,
        name: userContact?.name ? userContact.name : output.name,
      };
    }
    return output;
  }

  private async attachAvatar(
    input: BlockedUserOutput[],
  ): Promise<BlockedUserOutput[]> {
    const userAvatarIds = input.map((e) => e.avatar);
    const avatarUrls = await this.fileService.getFileUrls(userAvatarIds);
    return input.map((e) => {
      return {
        ...e,
        avatar: e.avatar in avatarUrls ? avatarUrls[e.avatar] : '',
      };
    });
  }

  async getUserBlockedList(
    ctx: RequestContext,
    userId: number,
    offset: number,
    limit: number,
  ): Promise<{
    data: BlockedUserOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.getUserBlockedList.name} was called`);
    try {
      const [blockedUsers, count] = await this.userBlockRepository.findAndCount(
        {
          where: {
            userId,
            status: true,
          },
          order: {
            updatedAt: 'DESC',
          },
          select: ['blockedUserId', 'blockedWalletAddress', 'type'],
          skip: offset,
          take: limit,
        },
      );
      const blockedWalletAddress = blockedUsers.map(
        (e) => e.blockedWalletAddress,
      );
      const blockedUserIds = blockedUsers.map(
        (blockedUser) => blockedUser.blockedUserId,
      );

      const [blockedUsersInfo, userContacts] = await Promise.all([
        this.getBlockedUserInfos(blockedUserIds),
        this.getUserContacts(userId, blockedWalletAddress),
      ]);

      let output =
        plainToClass(
          BlockedUserOutput,
          blockedUsers.map((e) => ({
            ...e,
            userId: e.blockedUserId,
            address: e.blockedWalletAddress,
          })),
          {
            excludeExtraneousValues: true,
          },
        )?.map((e) =>
          this.attachUserContactInfo(e, blockedUsersInfo, userContacts),
        ) || [];
      output = await this.attachAvatar(output);

      return {
        data: output?.sort((a, b) => a.name.localeCompare(b.name)) || [],
        count,
      };
    } catch (error) {
      console.error('error', error);
      return {
        data: [],
        count: 0,
      };
    }
  }

  async getP2PChatRoomsOfBlockedPair(
    userId: number,
    blockedWalletAddress: string,
  ): Promise<Partial<ChatRoom>[]> {
    const sql = `select cr.id
    from chat_room cr
    inner join member_in_room mir on mir.chatRoomId = cr.id and mir.userId = ${userId}
    inner join member_in_room mir2 on mir2.chatRoomId = cr.id and lower(mir2.walletAddress) = lower('${blockedWalletAddress}')
    where cr.isGroup = 0`;

    const p2pChatRooms = await getManager().query(sql);
    return p2pChatRooms;
  }

  async updateP2PChatRoomStatus({
    blockedWalletAddress,
    manager,
    status,
    userId,
  }: {
    userId: number;
    blockedWalletAddress: string;
    status: string;
    manager: EntityManager;
  }): Promise<void> {
    const p2pChatRooms = await this.getP2PChatRoomsOfBlockedPair(
      userId,
      blockedWalletAddress,
    );
    if (p2pChatRooms?.length > 0) {
      const chatRoomIds = p2pChatRooms.map((e) => e.id);
      await manager.update(
        ChatRoom,
        {
          id: In(chatRoomIds),
        },
        {
          status,
        },
      );
    }
  }

  async blockUser(ctx: RequestContext, input: BlockInput): Promise<boolean> {
    try {
      await this.connection.transaction(async (manager) => {
        const existingUserBlock = await this.userBlockRepository.findOne({
          where: {
            userId: ctx.user.id,
            blockedWalletAddress: input.address,
          },
        });
        if (existingUserBlock) {
          await manager.update(UserBlock, existingUserBlock.id, {
            status: true,
            reportContent: input?.reportContent || '',
            type: (input?.type?.length > 0 && input.type) || 'spam',
          });
        } else {
          const blockedUser =
            await this.userWalletService.findUserWalletByAddress(input.address);
          const newBlockUser = plainToClass(UserBlock, {
            userId: ctx.user.id,
            blockedUserId: blockedUser.userId,
            blockedWalletAddress: input.address,
            status: true,
            reportContent: input.reportContent,
            type: input.type,
          });
          await manager.save(newBlockUser);
        }
        await this.updateP2PChatRoomStatus({
          manager,
          status: CHAT_ROOM_STATUS.BLOCKED,
          blockedWalletAddress: input.address,
          userId: ctx.user.id,
        });
      });

      return true;
    } catch (error) {
      console.error('error', error);
    }
  }

  async unBlockUser(
    ctx: RequestContext,
    input: UnblockInput,
  ): Promise<boolean> {
    try {
      await this.connection.transaction(async (manager) => {
        const existingUserBlock = await this.userBlockRepository.findOne({
          where: {
            userId: ctx.user.id,
            blockedWalletAddress: input.address,
            status: 1,
          },
        });

        if (!existingUserBlock) {
          return;
        }

        await manager.update(UserBlock, existingUserBlock.id, {
          status: false,
        });

        const unblockingUserBlockedRequestUserRecord =
          await this.userBlockRepository.findOne({
            where: {
              userId: +existingUserBlock.blockedUserId,
              blockedWalletAddress: input.requestAddress,
              status: 1,
            },
          });

        if (!unblockingUserBlockedRequestUserRecord) {
          await this.updateP2PChatRoomStatus({
            manager,
            status: CHAT_ROOM_STATUS.DEPLOYED,
            blockedWalletAddress: input.address,
            userId: ctx.user.id,
          });
        }
      });

      return true;
    } catch (error) {
      console.error('error', error);
      return false;
    }
  }
}
