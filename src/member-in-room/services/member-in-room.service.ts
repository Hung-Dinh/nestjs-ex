import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { SendNotificationService } from 'src/chat-room/services/send-notification.service';
import { FileService } from 'src/file/services/file.service';
import { RoomNotificationTxService } from 'src/room-notification-tx/services/room-notification-tx.service';
import { ChatHelperService } from 'src/shared/chat-helper/services/chat-helper.service';
import {
  MAX_MEMBER_PER_GROUP,
  MEMBER_IN_ROOM_ROLE,
  MEMBER_IN_ROOM_STATUS,
  MESSAGE_TYPE,
  SOCKET_TYPE,
} from 'src/shared/constants';
import { QUEUE_JOB } from 'src/shared/constants/queue.constant';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { NumberTool } from 'src/shared/tools/number.tool';
import { ObjectTool } from 'src/shared/tools/object.tool';
import { UserService } from 'src/user/services/user.service';
import { UserContactService } from 'src/user-contact/services/user-contact.service';
import { UserSettingService } from 'src/user-setting/services/user-setting.service';
import { UserWalletService } from 'src/user-wallet/services/user-wallet.service';
import { getManager, In, Not } from 'typeorm';

import { AddMembersToRoomInput } from '../dtos/add-member-input.dto';
import { ApproveMembersInput } from '../dtos/approve-member-input.dto';
import { CancelInviteMemberInput } from '../dtos/cancel-invite-member-input.dto';
import { CanDoActionInput } from '../dtos/check-can-do-action-input.dto';
import { EditMemberRoleInput } from '../dtos/edit-member-role-input.dto';
import { MuteChatInput } from '../dtos/mute-chat-input.dto';
import { RemoveMemberFromRoomInput } from '../dtos/remove-member-input.dto';
import { RoomMemberDetailOutput } from '../dtos/room-member-detail-output.dto';
import { RoomMemberListItemOutput } from '../dtos/room-member-list-item-output';
import { SearchJoinedMemberListOutput } from '../dtos/search-joined-member-list-output';
import { MemberInRoom } from '../entities/member-in-room.entity';
import { MemberInRoomRepository } from '../repositories/member-in-room.repository';

@Injectable()
export class MemberInRoomService {
  constructor(
    private readonly logger: AppLogger,
    private readonly memberInRoomRepository: MemberInRoomRepository,
    private readonly userContactService: UserContactService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => UserWalletService))
    private readonly userWalletService: UserWalletService,
    private readonly chatHelperService: ChatHelperService,
    @Inject(forwardRef(() => SendNotificationService))
    private readonly sendNotificationService: SendNotificationService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    private readonly roomNotificationTxService: RoomNotificationTxService,
    private readonly userSettingService: UserSettingService,
  ) {
    this.logger.setContext(MemberInRoomService.name);
  }

  async checkRole(
    userId: number,
    roomId: number,
    roles: string[],
  ): Promise<boolean> {
    const roomMember = await this.memberInRoomRepository.findOne({
      where: {
        chatRoomId: roomId,
        userId,
      },
    });

    return roomMember && roles.includes(roomMember.role);
  }

  async isRoomOwnerOrAdmin(userId: number, roomId: number): Promise<boolean> {
    return this.checkRole(userId, roomId, [
      MEMBER_IN_ROOM_ROLE.ADMIN,
      MEMBER_IN_ROOM_ROLE.OWNER,
    ]);
  }

  async isRoomOwner(userId: number, roomId: number): Promise<boolean> {
    return this.checkRole(userId, roomId, [MEMBER_IN_ROOM_ROLE.OWNER]);
  }

  async findRoomMemberWithStatus(
    userId: number,
    roomId: number,
    status: string,
  ): Promise<MemberInRoom> {
    return this.memberInRoomRepository.findOne({
      where: {
        chatRoomId: roomId,
        userId,
        status,
      },
    });
  }

  async findJoinedMemberByUserId(
    userId: number,
    roomId: number,
  ): Promise<MemberInRoom> {
    console.log(`userId`, userId);
    console.log(`roomId`, roomId);

    const member = await this.findRoomMemberWithStatus(
      userId,
      roomId,
      MEMBER_IN_ROOM_STATUS.JOINED,
    );

    return member;
  }

  async findInvitedMemberByUserId(
    userId: number,
    roomId: number,
  ): Promise<MemberInRoom> {
    const member = await this.findRoomMemberWithStatus(
      userId,
      roomId,
      MEMBER_IN_ROOM_STATUS.INVITED,
    );

    return member;
  }

  async findInvitedOrJoinedMemberByAddress(
    address: string,
    roomId: number,
  ): Promise<MemberInRoom> {
    return this.memberInRoomRepository.findOne({
      where: {
        walletAddress: address,
        chatRoomId: roomId,
        status: In(
          Object.values(
            ObjectTool.omit(MEMBER_IN_ROOM_STATUS, [
              MEMBER_IN_ROOM_STATUS.OUT,
              MEMBER_IN_ROOM_STATUS.CANCEL,
            ]),
          ),
        ),
      },
    });
  }

  async findInvitedOrJoinedMemberByListAddress(
    listAddress: string[],
    roomId: number,
  ): Promise<MemberInRoom> {
    return this.memberInRoomRepository.findOne({
      where: {
        walletAddress: In(listAddress),
        chatRoomId: roomId,
        status: In(
          Object.values(
            ObjectTool.omit(MEMBER_IN_ROOM_STATUS, [
              MEMBER_IN_ROOM_STATUS.OUT,
              MEMBER_IN_ROOM_STATUS.CANCEL,
            ]),
          ),
        ),
      },
    });
  }

  async findInvitedOrJoinedMemberByUserId(
    userId: number,
    roomId: number,
  ): Promise<MemberInRoom> {
    return this.memberInRoomRepository.findOne({
      where: {
        userId: userId,
        chatRoomId: roomId,
        status: In(
          Object.values(
            ObjectTool.omit(MEMBER_IN_ROOM_STATUS, [
              MEMBER_IN_ROOM_STATUS.OUT,
              MEMBER_IN_ROOM_STATUS.CANCEL,
            ]),
          ),
        ),
      },
    });
  }

  async findOppositeMember(
    currentUserId: number,
    roomId: number,
  ): Promise<MemberInRoom> {
    const oppositeMember = await this.memberInRoomRepository.findOne({
      where: {
        chatRoomId: roomId,
        userId: Not(currentUserId),
      },
    });
    return oppositeMember;
  }

  async findRoomMember(
    roomId: number,
    status: string,
  ): Promise<MemberInRoom[]> {
    return this.memberInRoomRepository.find({
      where: {
        chatRoomId: roomId,
        status,
      },
    });
  }

  async findRoomOwner(roomId: number): Promise<MemberInRoom> {
    const owner = await this.memberInRoomRepository.findOne({
      where: {
        chatRoomId: roomId,
        role: MEMBER_IN_ROOM_ROLE.OWNER,
      },
    });
    return owner;
  }

  async updateMemberInRoom(updatedMember: MemberInRoom): Promise<MemberInRoom> {
    return this.memberInRoomRepository.save(updatedMember);
  }

  async getNumberOfMembersInRoom(roomId: number): Promise<number> {
    return this.memberInRoomRepository.count({
      where: {
        chatRoomId: roomId,
        status: In(
          Object.values(
            ObjectTool.omit(MEMBER_IN_ROOM_STATUS, [
              MEMBER_IN_ROOM_STATUS.OUT,
              MEMBER_IN_ROOM_STATUS.CANCEL,
            ]),
          ),
        ),
      },
    });
  }

  async getJoinedMembersInRoom(chatRoomId: number): Promise<MemberInRoom[]> {
    return await this.memberInRoomRepository.find({
      where: {
        chatRoomId: chatRoomId,
        status: MEMBER_IN_ROOM_STATUS.JOINED,
      },
    });
  }

  async getById(id: number): Promise<MemberInRoom> {
    return this.memberInRoomRepository.findOne(id);
  }

  async muteChatRoomById(
    ctx: RequestContext,
    input: MuteChatInput,
  ): Promise<void> {
    this.logger.log(ctx, `${this.muteChatRoomById.name} was called`);
    const memberInRoom = await this.findJoinedMemberByUserId(
      ctx.user.id,
      input.id,
    );
    if (!memberInRoom) {
      throw new Error('Chat room not found!');
    }
    const newUpdatedCMessage: MemberInRoom = {
      ...memberInRoom,
      muteDuration: input.muteUntillTime,
    };
    this.logger.log(
      ctx,
      `calling ${MemberInRoomRepository.name}.update memberInRoom`,
    );
    await this.memberInRoomRepository.update(
      newUpdatedCMessage.id,
      newUpdatedCMessage,
    );
  }

  async unmuteChatRoomById(ctx: RequestContext, id: number): Promise<void> {
    this.logger.log(ctx, `${this.unmuteChatRoomById.name} was called`);
    console.log('userId, id__________________', ctx.user.id, id);
    const memberInRoom = await this.findJoinedMemberByUserId(ctx.user.id, id);
    if (!memberInRoom) {
      throw new Error('Chat room not found!');
    }
    const newUpdatedCMessage: MemberInRoom = {
      ...memberInRoom,
      muteDuration: null,
      updatedAt: new Date(),
    };
    this.logger.log(
      ctx,
      `calling ${MemberInRoomRepository.name}.update memberInRoom`,
    );
    await this.memberInRoomRepository.update(
      newUpdatedCMessage.id,
      newUpdatedCMessage,
    );
  }

  async pinChatRoomById(ctx: RequestContext, id: number): Promise<void> {
    this.logger.log(ctx, `${this.pinChatRoomById.name} was called`);
    const memberInRoom = await this.findJoinedMemberByUserId(ctx.user.id, id);
    if (!memberInRoom) {
      throw new Error('Chat room not found!');
    }
    const newUpdatedCMessage: MemberInRoom = {
      ...memberInRoom,
      isPinned: true,
      updatedAt: new Date(),
    };
    this.logger.log(
      ctx,
      `calling ${MemberInRoomRepository.name}.update memberInRoom`,
    );
    await this.memberInRoomRepository.update(
      newUpdatedCMessage.id,
      newUpdatedCMessage,
    );
  }

  async unpinChatRoomById(ctx: RequestContext, id: number): Promise<void> {
    this.logger.log(ctx, `${this.unpinChatRoomById.name} was called`);
    const memberInRoom = await this.findJoinedMemberByUserId(ctx.user.id, id);
    if (!memberInRoom) {
      throw new Error('Chat room not found!');
    }
    const newUpdatedCMessage: MemberInRoom = {
      ...memberInRoom,
      isPinned: false,
      updatedAt: new Date(),
    };
    this.logger.log(
      ctx,
      `calling ${MemberInRoomRepository.name}.update memberInRoom`,
    );
    await this.memberInRoomRepository.update(
      newUpdatedCMessage.id,
      newUpdatedCMessage,
    );
  }

  async getRoomMemberList(
    ctx: RequestContext,
    roomId: number,
    memberStatus: string,
    limit: number,
    offset: number,
  ): Promise<{
    members: RoomMemberListItemOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.getRoomMemberList.name} was called`);
    const userId = ctx?.user?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const member = await this.findJoinedMemberByUserId(userId, roomId);
    if (!member) {
      throw new Error('User is not in this room!');
    }

    if (memberStatus && !MEMBER_IN_ROOM_STATUS[memberStatus.toUpperCase()]) {
      throw new Error('memberStatus is not valid!');
    }

    const isRoomOwner = await this.isRoomOwnerOrAdmin(userId, roomId);
    const memberStatusFilters = isRoomOwner
      ? memberStatus
        ? [memberStatus]
        : Object.values(
            ObjectTool.omit(MEMBER_IN_ROOM_STATUS, [
              MEMBER_IN_ROOM_STATUS.OUT,
              MEMBER_IN_ROOM_STATUS.CANCEL,
            ]),
          )
      : [MEMBER_IN_ROOM_STATUS.JOINED];

    const count = await this.memberInRoomRepository.count({
      where: {
        chatRoomId: roomId,
        status: In(memberStatusFilters),
      },
    });

    const joinedMemberStatusFilters = `${memberStatusFilters
      .map((e) => `"${e}"`)
      .join(',')}`;
    const members = await this.memberInRoomRepository
      .createQueryBuilder()
      .where('chatRoomId = :roomId', { roomId })
      .andWhere(`status IN (${joinedMemberStatusFilters})`)
      .orderBy(`FIELD(status, ${joinedMemberStatusFilters})`)
      .addOrderBy('createdAt', 'DESC')
      .addOrderBy('displayName')
      .limit(limit)
      .offset(offset)
      .getMany();

    const membersOutput = await Promise.all(
      members.map(async (member: MemberInRoom) => {
        const [user, userContact] = await Promise.all([
          this.userService.findUserByUserId(member.userId),
          this.userContactService.findByAddress(userId, member.walletAddress),
        ]);

        let avatar = '';
        if (
          userContact?.avatar &&
          NumberTool.isStringNumber(userContact.avatar)
        ) {
          avatar = await this.fileService.getFileUrl(+userContact.avatar);
        } else if (user?.avatar && NumberTool.isStringNumber(user.avatar)) {
          avatar = await this.fileService.getFileUrl(+user.avatar);
        }

        return plainToClass(
          RoomMemberListItemOutput,
          {
            ...member,
            avatar,
            nickname: userContact?.name || '',
            displayName: user.name,
          },
          {
            excludeExtraneousValues: true,
          },
        );
      }),
    );

    return {
      members: membersOutput,
      count,
    };
  }

  async getRoomMemberDetail(
    ctx: RequestContext,
    id: number,
  ): Promise<RoomMemberDetailOutput> {
    this.logger.log(ctx, `${this.getRoomMemberDetail.name} was called`);

    const member = await this.memberInRoomRepository.findOne(id);
    if (!member) {
      throw new Error('User not found!');
    }
    const user = await this.userService.findUserByUserId(member.userId);
    if (!user) {
      throw new Error('User not found!');
    }
    const userContact = await this.userContactService.findByAddress_Query(
      ctx.user.id,
      member.walletAddress,
    );

    let avatar = '';
    if (userContact?.avatar && NumberTool.isStringNumber(userContact.avatar)) {
      avatar = await this.fileService.getFileUrl(+userContact.avatar);
    } else if (user?.avatar && NumberTool.isStringNumber(user.avatar)) {
      avatar = await this.fileService.getFileUrl(+user.avatar);
    }

    const GET_BLOCKED_USER_BY_ADDRESS_QUERY = `
      select user_block.blockedUserId from user_block
      where user_block.userId = ${ctx.user.id} 
      and user_block.blockedWalletAddress = "${member.walletAddress}"
      and status = 1
    `;
    const blockedUser = await getManager().query(
      GET_BLOCKED_USER_BY_ADDRESS_QUERY,
    );

    return plainToClass(RoomMemberDetailOutput, {
      ...member,
      userContactId: userContact?.id || null,
      avatar,
      nickname: userContact?.name || '',
      displayName: user.name,
      isInContactList: !!userContact?.id,
      isBlocked: blockedUser?.length > 0,
    });
  }

  async addMemberToRoom(
    ctx: RequestContext,
    addUserId: number,
    roomId: number,
    invitingMemberAddress: string,
  ): Promise<RoomMemberListItemOutput> {
    const isNewMemberInRoom = await this.findInvitedOrJoinedMemberByAddress(
      invitingMemberAddress,
      roomId,
    );
    if (isNewMemberInRoom) {
      throw new Error('Member already in room');
    }

    const userWallet = await this.userWalletService.findUserWalletByAddress(
      invitingMemberAddress,
    );
    if (!userWallet) {
      throw new Error(`${invitingMemberAddress} is not registered on system`);
    }

    const newMemberUserId = userWallet?.userId;
    const user = await this.userService.findUserByUserId(newMemberUserId);

    const newMember = plainToClass(MemberInRoom, {
      chatRoomId: roomId,
      userId: newMemberUserId,
      walletAddress: invitingMemberAddress,
      displayName: user?.name,
      nickname: null,
      role: MEMBER_IN_ROOM_ROLE.MEMBER,
      status: MEMBER_IN_ROOM_STATUS.INVITED,
      addedByUserId: addUserId,
      isChatArchived: false,
      isPinned: false,
      muteDuration: null,
      lastViewedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const newMemberInRoomDb = await this.memberInRoomRepository.save(newMember);

    // send notification
    const notificationInfo = await this.getNotificationInfo(
      roomId,
      newMemberUserId,
      addUserId,
      MEMBER_IN_ROOM_STATUS.JOINED,
    );
    this.sendNotificationService.addNotificationToQueue(ctx, {
      userId: newMemberUserId,
      type: SOCKET_TYPE.ROOM_INVITATION,
      data: {
        status: MEMBER_IN_ROOM_STATUS.INVITED,
        roomId: roomId.toString(),
        action: QUEUE_JOB.CHAT.INVITE_MEMBER,
      },
      notification: {
        title: notificationInfo.chatRoomName,
        body: `${notificationInfo.showName} has invited you to join the group`,
      },
    });

    return plainToClass(RoomMemberListItemOutput, newMemberInRoomDb, {
      excludeExtraneousValues: true,
    });
  }

  async getNotificationInfo(
    roomId: number,
    getInfoUserId: number,
    showInfoUserId: number,
    status: string,
  ) {
    const sql = ` select cr.name as chatRoomName, ifnull(uc.name, u.name) as showName 
    from member_in_room mir 
    inner join chat_room cr on cr.id = mir.chatRoomId
    inner join users u on u.id = mir.userId
    left join user_contact uc on uc.userId = ${getInfoUserId} and lower(uc.address) = lower(mir.walletAddress) 
    where mir.userId = ${showInfoUserId}
    and mir.chatRoomId = ${roomId}
    and mir.status = '${status}'`;
    console.log('sql__________________', sql);
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const info = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const info = await entityManager.query(sql);

    if (!info || info.length == 0) {
      return {};
    } else {
      return info[0];
    }
  }

  async checkCanDoAction(
    ctx: RequestContext,
    input: CanDoActionInput,
  ): Promise<boolean> {
    const isThereAnyAddressProcessingAnotherTransaction =
      await this.roomNotificationTxService.checkProcessingAddresses(
        input.roomId,
        input.addresses,
      );
    return !isThereAnyAddressProcessingAnotherTransaction;
  }

  async addMemberListToRoom(
    ctx: RequestContext,
    input: AddMembersToRoomInput,
  ): Promise<RoomMemberListItemOutput[]> {
    this.logger.log(ctx, `${this.addMemberListToRoom.name} was called`);
    const userId = ctx?.user?.id;
    const { addresses, roomId } = input;

    if (addresses.length > MAX_MEMBER_PER_GROUP) {
      throw new Error(`Max member per group is ${MAX_MEMBER_PER_GROUP}`);
    }

    const numberOfMemberInRoom = await this.getNumberOfMembersInRoom(roomId);
    if (numberOfMemberInRoom + addresses.length > MAX_MEMBER_PER_GROUP) {
      throw new Error(`Max member per group is ${MAX_MEMBER_PER_GROUP}`);
    }

    const owner = await this.findJoinedMemberByUserId(userId, roomId);
    if (owner.role !== MEMBER_IN_ROOM_ROLE.OWNER) {
      throw new Error('You do not have permission to do this');
    }

    const existMember = await this.findInvitedOrJoinedMemberByListAddress(
      addresses,
      roomId,
    );

    if (existMember) {
      const adminContact = await this.userContactService.findByAddress_Query(
        userId,
        existMember.walletAddress,
      );
      const showName = adminContact.name || existMember.displayName;
      if (existMember.status == MEMBER_IN_ROOM_STATUS.JOINED) {
        throw new Error(`${showName} had joined the group`);
      } else {
        throw new Error(`${showName} had been invited to the group`);
      }
    }

    // check walletAddress in another progress in this chatroom
    const checkAddressInProgress =
      await this.roomNotificationTxService.checkProcessingAddresses(
        roomId,
        addresses,
      );
    if (checkAddressInProgress === true) {
      throw new Error(
        'This action is invalid because the selected user(s) are currently in progress for another transaction.',
      );
    }

    const newMemberList = await Promise.all(
      addresses.map(async (address: string) => {
        return this.addMemberToRoom(ctx, userId, roomId, address);
      }),
    );

    return newMemberList;
  }

  async removeMemberFromRoom(
    ctx: RequestContext,
    input: RemoveMemberFromRoomInput,
  ): Promise<void> {
    this.logger.log(ctx, `${this.removeMemberFromRoom.name} was called`);
    const userId = ctx?.user?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const { addresses, roomId } = input;
    const isOwnerOrAdmin = await this.isRoomOwnerOrAdmin(userId, roomId);

    if (!isOwnerOrAdmin) {
      throw new Error("You don't have permission to do this");
    }
    const owner = await this.findJoinedMemberByUserId(userId, roomId);
    const memberList = await this.memberInRoomRepository.find({
      where: {
        chatRoomId: roomId,
        walletAddress: In(addresses),
        status: In(
          Object.values(
            ObjectTool.omit(MEMBER_IN_ROOM_STATUS, [MEMBER_IN_ROOM_STATUS.OUT]),
          ),
        ),
      },
    });

    // check walletAddress in another progress in this chatroom
    const checkAddressInProgress =
      await this.roomNotificationTxService.checkProcessingAddresses(
        roomId,
        addresses,
      );
    if (checkAddressInProgress === true) {
      throw new Error(
        'This action is invalid because the selected user(s) are currently in progress for another transaction.',
      );
    }

    const joinedRoomAddresses = addresses.filter((address) =>
      memberList.find(
        (x) =>
          x.walletAddress.toLowerCase() == address?.toLocaleLowerCase() &&
          x.status == MEMBER_IN_ROOM_STATUS.JOINED,
      ),
    );
    memberList.forEach(async (member) => {
      const oldStatus = member.status;
      // await this.messageService.createNotificationMessage({
      //   userId,
      //   walletAddress: owner.walletAddress,
      //   chatRoomId: roomId,
      //   content: `${member.displayName} has been removed from the room`,
      // });

      if (
        oldStatus == MEMBER_IN_ROOM_STATUS.INVITED ||
        oldStatus == MEMBER_IN_ROOM_STATUS.PENDING_APPROVAL
      ) {
        // update member status
        member.status = MEMBER_IN_ROOM_STATUS.OUT;
        member.updatedAt = new Date();
        await this.memberInRoomRepository.update(member.id, member);

        // send notification to member
        const notificationInfo = await this.getNotificationInfo(
          roomId,
          member.userId,
          userId,
          MEMBER_IN_ROOM_STATUS.JOINED,
        );
        await this.sendNotificationService.addNotificationToQueue(ctx, {
          userId: member.userId,
          type: SOCKET_TYPE.ROOM_INVITATION,
          data: {
            status: MEMBER_IN_ROOM_STATUS.OUT,
            roomId: roomId.toString(),
            action: QUEUE_JOB.CHAT.REMOVE_MEMBERS,
          },
          notification: {
            title: notificationInfo.chatRoomName,
            body: `Your invitation has been canceled`,
          },
        });
      }
    });

    if (joinedRoomAddresses.length > 0) {
      await this.chatHelperService.sendChatQueueData({
        fromUserId: owner.userId,
        fromWalletAddress: owner.walletAddress,
        messageContents: memberList.map(
          (member) => `${member?.nickname} was removed from the room`,
        ),
        messageType: MESSAGE_TYPE.ROOM_NOTIFICATION,
        roomId,
        toWalletAddresses: joinedRoomAddresses,
        jobName: QUEUE_JOB.CHAT.REMOVE_MEMBERS,
      });
    }
  }

  async insertMember(
    ctx: RequestContext,
    member: Record<string, any>,
  ): Promise<Record<string, any>> {
    const newMember = plainToClass(MemberInRoom, member);
    this.logger.log(ctx, `${this.memberInRoomRepository.save} was called`);
    return await this.memberInRoomRepository.save(newMember);
  }

  async updateMemberStatus(input: {
    ownerId: number;
    memberId: number;
    roomId: number;
    oldStatus: string;
    newStatus: string;
  }): Promise<MemberInRoom> {
    const { ownerId, memberId, roomId, oldStatus, newStatus } = input;

    const isOwner = await this.isRoomOwnerOrAdmin(ownerId, roomId);
    if (!isOwner) {
      throw new Error("You don't have permission to do this");
    }

    const member = await this.findRoomMemberWithStatus(
      memberId,
      roomId,
      oldStatus,
    );
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // check walletAddress in another progress in this chatroom
    const checkAddressInProgress =
      await this.roomNotificationTxService.checkProcessingOneAddress(
        roomId,
        member.walletAddress,
      );
    if (checkAddressInProgress === true) {
      throw new Error(
        'This action is invalid because the selected user(s) are currently in progress for another transaction.',
      );
    }

    member.status = newStatus;
    return this.memberInRoomRepository.save(member);
  }

  async approveMember(
    ctx: RequestContext,
    input: ApproveMembersInput,
  ): Promise<RoomMemberListItemOutput[]> {
    this.logger.log(ctx, `${this.approveMember.name} was called`);
    const userId = ctx?.user?.id;
    const { addresses: pendingApprovalWalletAddresses, roomId } = input;

    const ownerOrAdmin = await this.findJoinedMemberByUserId(userId, roomId);
    if (ownerOrAdmin.role === MEMBER_IN_ROOM_ROLE.MEMBER) {
      throw new Error(`You don't have permission to perform this action`);
    }

    const pendingMembers = await this.memberInRoomRepository.find({
      where: {
        chatRoomId: roomId,
        walletAddress: In(pendingApprovalWalletAddresses),
        status: MEMBER_IN_ROOM_STATUS.PENDING_APPROVAL,
      },
    });

    // check walletAddress in another progress in this chatroom
    const checkAddressInProgress =
      await this.roomNotificationTxService.checkProcessingAddresses(
        roomId,
        pendingApprovalWalletAddresses,
      );
    if (checkAddressInProgress === true) {
      throw new Error(
        'This action is invalid because the selected user(s) are currently in progress for another transaction.',
      );
    }

    await this.chatHelperService.sendChatQueueData({
      fromUserId: ownerOrAdmin.userId,
      fromWalletAddress: ownerOrAdmin.walletAddress,
      messageContents: pendingMembers.map(
        (member) => `${member?.nickname || member.displayName} joined the room`,
      ),
      messageType: MESSAGE_TYPE.ROOM_NOTIFICATION,
      roomId,
      toWalletAddresses: pendingApprovalWalletAddresses,
      jobName: QUEUE_JOB.CHAT.ACCEPT_JOIN_GROUP,
    });

    return plainToClass(RoomMemberListItemOutput, pendingMembers, {
      excludeExtraneousValues: true,
    });
  }

  async cancelInviteMember(
    ctx: RequestContext,
    input: CancelInviteMemberInput,
  ): Promise<RoomMemberListItemOutput> {
    this.logger.log(ctx, `${this.cancelInviteMember.name} was called`);
    const userId = ctx?.user?.id;
    const { userId: invitingUserId, roomId } = input;

    const updatedMember = await this.updateMemberStatus({
      ownerId: userId,
      memberId: invitingUserId,
      roomId,
      oldStatus: MEMBER_IN_ROOM_STATUS.INVITED,
      newStatus: MEMBER_IN_ROOM_STATUS.OUT,
    });

    // send notification to member
    const notificationInfo = await this.getNotificationInfo(
      roomId,
      invitingUserId,
      userId,
      MEMBER_IN_ROOM_STATUS.JOINED,
    );
    this.sendNotificationService.addNotificationToQueue(ctx, {
      userId: invitingUserId,
      type: SOCKET_TYPE.ROOM_INVITATION,
      data: {
        status: MEMBER_IN_ROOM_STATUS.OUT,
        roomId: roomId.toString(),
        action: QUEUE_JOB.CHAT.REMOVE_MEMBERS,
      },
      notification: {
        title: notificationInfo.chatRoomName,
        body: `Your invitation has been canceled`,
      },
    });

    return plainToClass(RoomMemberListItemOutput, updatedMember, {
      excludeExtraneousValues: true,
    });
  }
  async updateLastTimeViewed(
    ctx: RequestContext,
    roomId: number,
  ): Promise<RoomMemberListItemOutput> {
    this.logger.log(ctx, `${this.updateLastTimeViewed.name} was called`);
    const userId = ctx?.user?.id;
    const member = await this.findJoinedMemberByUserId(userId, roomId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    member.lastViewedAt = new Date();
    const updatedMember = await this.memberInRoomRepository.save(member);
    return plainToClass(RoomMemberListItemOutput, updatedMember, {
      excludeExtraneousValues: true,
    });
  }

  async editMemberRole(
    ctx: RequestContext,
    input: EditMemberRoleInput,
  ): Promise<RoomMemberListItemOutput[]> {
    this.logger.log(ctx, `${this.editMemberRole.name} was called`);
    const userId = ctx?.user?.id;
    const { roomId, userIds: memberIds, role } = input;

    const owner = await this.findJoinedMemberByUserId(userId, roomId);
    if (!owner || owner.role !== MEMBER_IN_ROOM_ROLE.OWNER) {
      throw new Error('You are not owner of this room');
    }

    const members = await this.memberInRoomRepository.find({
      where: {
        chatRoomId: roomId,
        userId: In(memberIds),
        status: MEMBER_IN_ROOM_STATUS.JOINED,
      },
    });
    const currentRole = [...new Set(members.map((member) => member.role))];

    if (currentRole.length > 1) {
      throw new Error(
        'You can not edit role of members who have different roles',
      );
    }

    const walletAddresses = members.map((member) => member.walletAddress);

    // check walletAddress in another progress in this chatroom
    const checkAddressInProgress =
      await this.roomNotificationTxService.checkProcessingAddresses(
        roomId,
        walletAddresses,
      );
    if (checkAddressInProgress === true) {
      throw new Error(
        'This action is invalid because the selected user(s) are currently in progress for another transaction.',
      );
    }

    if (role !== currentRole[0]) {
      if (role !== MEMBER_IN_ROOM_ROLE.OWNER) {
        await this.chatHelperService.sendChatQueueData({
          fromUserId: owner.userId,
          fromWalletAddress: owner.walletAddress,
          messageContents: members.map(
            (member) =>
              `${member?.nickname || member.displayName} is now ${role}`,
          ),
          messageType: MESSAGE_TYPE.ROOM_NOTIFICATION,
          roomId,
          toWalletAddresses: members.map((member) => member.walletAddress),
          jobName:
            role === MEMBER_IN_ROOM_ROLE.ADMIN
              ? QUEUE_JOB.CHAT.SET_ADMIN
              : QUEUE_JOB.CHAT.REMOVE_ADMIN,
        });
      }
    }

    return plainToClass(RoomMemberListItemOutput, members, {
      excludeExtraneousValues: true,
    });
  }

  async searchJoinedRoomMembers(
    ctx: RequestContext,
    roomId: number,
    nameOrAddress: string,
    limit: number,
    offset: number,
  ): Promise<{
    members: SearchJoinedMemberListOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.searchJoinedRoomMembers.name} was called`);
    const userId = ctx?.user?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    const isRoomMember = await this.findJoinedMemberByUserId(userId, roomId);
    if (!isRoomMember) {
      throw new Error("You aren't a member of this group");
    }

    const count =
      (await this.memberInRoomRepository.count({
        where: {
          chatRoomId: roomId,
          status: MEMBER_IN_ROOM_STATUS.JOINED,
        },
      })) - 1;

    let sql = ` select distinct mir.id, mir.chatRoomId, mir.userId, mir.walletAddress, mir.role, 
    ifnull(uc.name , u.name) as name,
    ifnull(uc.avatar, u.avatar) as avatar
    from member_in_room mir 
    inner join chat_room cr on cr.id = mir.chatRoomId 
    inner join users u on u.id = mir.userId 
    left join user_contact uc on uc.userId = ${userId} and lower(uc.address) = lower(mir.walletAddress) 
    where mir.chatRoomId = ${roomId}
    and mir.userId != ${userId}
    and mir.status = '${MEMBER_IN_ROOM_STATUS.JOINED}'`;

    if (nameOrAddress) {
      sql += ` and (lower(ifnull(uc.name , u.name)) like lower('%${nameOrAddress}%') 
                   or lower(mir.walletAddress) like lower('%${nameOrAddress}%'))`;
    }

    sql += ` order by name asc
    limit ${limit}
    offset ${offset}`;
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const membersOutput = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const searchResults = await entityManager.query(sql);

    const searchResultAvatarIds = searchResults
      .map((member: any) => {
        return member.avatar;
      })
      .filter(Boolean);

    const avatarUrls = await this.fileService.getFileUrls(
      searchResultAvatarIds,
    );

    const membersOutput = searchResults.map((member: any) => {
      if (member?.avatar && avatarUrls[member.avatar]) {
        member.avatar = avatarUrls[member.avatar];
      } else {
        member.avatar = '';
      }

      return member;
    });

    return {
      members: plainToClass(
        SearchJoinedMemberListOutput,
        <any[]>membersOutput,
        {
          excludeExtraneousValues: true,
        },
      ),
      count,
    };
  }
}
