import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import moment from 'moment';
import { FileService } from 'src/file/services/file.service';
import { RoomMemberDetailOutput } from 'src/member-in-room/dtos/room-member-detail-output.dto';
import { RoomMemberListItemOutput } from 'src/member-in-room/dtos/room-member-list-item-output';
import { MemberInRoom } from 'src/member-in-room/entities/member-in-room.entity';
import { MemberInRoomService } from 'src/member-in-room/services/member-in-room.service';
import { MessageService } from 'src/message/services/message.service';
import { RoomKeyService } from 'src/room-key/services/room-key.service';
import { RoomNotificationTxService } from 'src/room-notification-tx/services/room-notification-tx.service';
import { BlockchainService } from 'src/shared/blockchain-service/blockchain-service.service';
import { ChatHelperService } from 'src/shared/chat-helper/services/chat-helper.service';
import {
  CHAT_ROOM_STATUS,
  DISPLAY_ON_MY_SELF,
  IN_CHAT_NOTIFICATION_MID_CONTENT,
  MAX_MEMBER_PER_GROUP,
  MEMBER_IN_ROOM_ROLE,
  MEMBER_IN_ROOM_STATUS,
  MESSAGE_FILE_TYPE,
  MESSAGE_STATUS,
  MESSAGE_TYPE,
  SOCKET_TYPE,
} from 'src/shared/constants';
import { QUEUE_JOB } from 'src/shared/constants/queue.constant';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { NumberTool } from 'src/shared/tools/number.tool';
import { UserTokenService } from 'src/user-token/services/user-token.service';
import { getManager } from 'typeorm';

import { AddGroupChatRoomInput } from '../dtos/add-group-chat-room-input.dto';
import { AddSingleChatRoomInput } from '../dtos/add-single-chat-room-input.dto';
import { ChatRoomOutput } from '../dtos/chat-room-output.dto';
import { ChatRoomDetailOutput } from '../dtos/detail-chat-room-output.dto';
import { SearchChatParamsDto } from '../dtos/search-chat-param.dto';
import { SearchChatRoomOutput } from '../dtos/search-chat-room-output.dto';
import { UpdateChatRoomInput } from '../dtos/update-chat-room-input.dto';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatRoomRepository } from '../repositories/chat-room.repository';
import { SendNotificationService } from './send-notification.service';

@Injectable()
export class ChatRoomService {
  constructor(
    private readonly logger: AppLogger,
    private readonly chatRoomRepository: ChatRoomRepository,
    @Inject(forwardRef(() => MemberInRoomService))
    private readonly memberInRoomService: MemberInRoomService,
    @Inject(forwardRef(() => MessageService))
    private readonly messageService: MessageService,
    @Inject(forwardRef(() => RoomKeyService))
    private readonly roomKeyService: RoomKeyService,
    private readonly chatHelperService: ChatHelperService,
    private readonly sendNotificationService: SendNotificationService,
    private readonly blockchainService: BlockchainService,
    private userTokenService: UserTokenService,
    private readonly fileService: FileService,
    private readonly roomNotificationTxService: RoomNotificationTxService,
  ) {
    this.logger.setContext(ChatRoomService.name);
  }

  async findRoomById(roomId: number): Promise<ChatRoom> {
    const room = await this.chatRoomRepository.findOne(roomId);
    if (!room) {
      throw new NotFoundException(`Room not found`);
    }

    return room;
  }

  async getChatRoomList(
    ctx: RequestContext,
    userId: number,
    networkId: number,
    offset: number,
    limit: number,
  ): Promise<{
    chats: SearchChatRoomOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.getChatRoomList.name} was called`);

    const sql = `select distinct
        cr.id,
        if(
          cr.isGroup != 0, 
          cr.name ,
          (select ifnull(uc2.name , u.name) as name
            from user_wallet uw
            inner join users u on u.id = uw.userId
            left join user_contact uc2 on uc2.userId = ${userId} and lower(uc2.address) = lower(uw.address)
            where lower(uw.address) = lower((select walletAddress 
                                from member_in_room
                                where chatRoomId = cr.id 
                                and userId != ${userId}
                                limit 1))
            limit 1
          )     
        ) as roomName,
        if(
          cr.isGroup != 0, 
          cr.avatar,
          (select ifnull(uc2.avatar, u.avatar) as avatar
            from user_wallet uw
            inner join users u on u.id = uw.userId
            left join user_contact uc2 on uc2.userId = ${userId}  and lower(uc2.address) = lower(uw.address)
            where lower(uw.address) = lower((select walletAddress 
                                from member_in_room
                                where chatRoomId = cr.id 
                                and userId != ${userId} 
                                limit 1))
            limit 1
          )      
        ) as roomAvatar,
        m.type,
        m.content,
        m.file,
        m.downloadUrl,
        if(m.userId = ${userId}, '${DISPLAY_ON_MY_SELF}', ifnull(uc.name, u2.name)) as lastUser,
        m.createdAt as lastPostTime,
        mir.lastViewedAt,
        cr.isGroup,
        mir.isPinned,
        mir.muteDuration,
        mir.status as memberStatus,
        cr.status as chatRoomSatus,
        m.status as messageStatus,
        cr.networkId,
        if(cr.ownerId = ${userId}, 1, 0) as isOwner,
        m.toAddress,
        m.tokenSymbol,
        m.amount,
        m.notiType,
        m.notiMidContent,
        m.notiEndContent,
        if(mir.status = '${MEMBER_IN_ROOM_STATUS.INVITED}', 1, 0) as isInvitedMember,
        if(cr.isGroup = 0, (select walletAddress 
          from member_in_room
          where chatRoomId = cr.id 
          and userId != ${userId} 
          limit 1), null) as walletAddress,
        (case when rnt2.status in ('${MESSAGE_STATUS.IN_PROGRESS}', 
                                   '${MESSAGE_STATUS.PENDING_RETRY}', 
                                   '${MESSAGE_STATUS.RETRYING}') then '${MESSAGE_STATUS.IN_PROGRESS}'
              when rnt2.status = '${MESSAGE_STATUS.FAILED}' then '${MESSAGE_STATUS.FAILED}'
         end) as leavingStatus    
        from member_in_room mir
        inner join chat_room cr on cr.id = mir.chatRoomId and (cr.status != '${CHAT_ROOM_STATUS.CREATED}' or cr.ownerId = ${userId})
        left outer join (
          select distinct m2.*,
            t.toAddress, t.tokenSymbol, t.amount, 
            ifnull(rat.type, rnt.type) as notiType,
            (case when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.CREATE_GROUP_CHAT}' 
                     then '${IN_CHAT_NOTIFICATION_MID_CONTENT.CREATED_THE_GROUP}'
                when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.REDEPLOY_GROUP_CHAT}' 
                     then '${IN_CHAT_NOTIFICATION_MID_CONTENT.CREATED_THE_GROUP}'
                when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.CHANGE_GROUP_NAME}' 
                     then '${IN_CHAT_NOTIFICATION_MID_CONTENT.CHANGED_GROUP_NAME_TO}'
                when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.LEAVE_ROOM}' 
                     then '${IN_CHAT_NOTIFICATION_MID_CONTENT.LEFT_THE_GROUP}'
                when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.ACCEPT_JOIN_GROUP}' 
                     then '${IN_CHAT_NOTIFICATION_MID_CONTENT.JOINED_THE_GROUP}'
                when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.REMOVE_MEMBERS}' 
                     then '${IN_CHAT_NOTIFICATION_MID_CONTENT.REMOVED}'
                when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.SET_ADMIN}' 
                     then '${IN_CHAT_NOTIFICATION_MID_CONTENT.SET_ADMIN_ROLE_TO}'
                when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.REMOVE_ADMIN}' 
                     then '${IN_CHAT_NOTIFICATION_MID_CONTENT.REMOVED_ADMIN_ROLE_FROM}'
            end) as notiMidContent,
            (case when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.CHANGE_GROUP_NAME}' 
                     then rat.data
                when ifnull(rat.type, rnt.type) in ('${QUEUE_JOB.CHAT.REMOVE_MEMBERS}',
                                                    '${QUEUE_JOB.CHAT.ACCEPT_JOIN_GROUP}',  
                                                    '${QUEUE_JOB.CHAT.SET_ADMIN}', 
                                                    '${QUEUE_JOB.CHAT.REMOVE_ADMIN}')  
                     then   (
                             select if(u2.id = ${userId}, '${DISPLAY_ON_MY_SELF}' , ifnull(uc2.name, u2.name)) as data
                             from user_wallet uw
                             inner join users u2 on u2.id = uw.userId
                             left outer join user_contact uc2 on uc2.userId = ${userId} and lower(uc2.address) = lower(rnt.walletAddress)
                             where lower(uw.address) = lower(rnt.walletAddress)
                             limit 1)
            end) as notiEndContent
            from messages m2
            left outer join transaction t on t.id = m2.transactionId 
            left outer join room_action_tx rat on rat.messageId = m2.id and rat.id = (select max(id) from room_action_tx where messageId = m2.id)
            left outer join room_notification_tx rnt on rnt.messageId = m2.id and rnt.id = (select max(id) from room_notification_tx where messageId = m2.id)
          ) m on m.chatRoomId  = cr.id 
              and if(m.userId = ${userId} 
                     and m.type != '${MESSAGE_TYPE.ROOM_ACTION}' 
                     and m.type != '${MESSAGE_TYPE.ROOM_NOTIFICATION}', 
                  m.status != '${MESSAGE_STATUS.HIDDEN}', 
                  m.status = '${MESSAGE_STATUS.COMPLETED}') 
              and m.id = (select max(messages.id) 
                                       from messages
                                       left outer join remove_message rm on rm.messageId = messages.id and rm.userId = ${userId} 
                                       where if(messages.userId = ${userId} and messages.type != '${MESSAGE_TYPE.ROOM_ACTION}' and messages.type != '${MESSAGE_TYPE.ROOM_NOTIFICATION}', 
                                        messages.status != '${MESSAGE_STATUS.HIDDEN}', 
                                        messages.status = '${MESSAGE_STATUS.COMPLETED}') 
                                       and messages.chatRoomId = cr.id
                                       and rm.id is null
                                )
        left outer join room_notification_tx rnt2 on rnt2.id = (select max(id)
                                                                from room_notification_tx
                                                                where chatRoomId = cr.id 
                                                                and walletAddress = mir.walletAddress
                                                               )
                                                  and rnt2.type = '${QUEUE_JOB.CHAT.LEAVE_ROOM}' 
                                                  and (rnt2.status != '${MESSAGE_STATUS.FAILED}' or rnt2.updatedAt >= m.updatedAt)                        
        left outer join users u2 on u2.id = m.userId 
        left outer join user_contact uc on uc.userId = ${userId} and lower(uc.address) = lower(m.walletAddress)   
        where mir.status in ('${MEMBER_IN_ROOM_STATUS.JOINED}', '${MEMBER_IN_ROOM_STATUS.INVITED}', '${MEMBER_IN_ROOM_STATUS.PENDING_APPROVAL}')   
        and mir.userId = ${userId}
        and cr.networkId = ${networkId}
        and if(cr.ownerId = ${userId}, cr.status != '${CHAT_ROOM_STATUS.CANCEL}', cr.status In ('${CHAT_ROOM_STATUS.DEPLOYED}', '${CHAT_ROOM_STATUS.BLOCKED}'))
        and (cr.isGroup != 0 or (m.type != '${MESSAGE_TYPE.ROOM_NOTIFICATION}' and m.type != '${MESSAGE_TYPE.ROOM_ACTION}' and m.type != '${MESSAGE_TYPE.SYSTEM}')) 
        order by mir.isPinned desc, m.createdAt desc
        limit ${limit}
        offset ${offset}`;

    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const chatRoomList = await slaveQueryRunner.query(sql);
    const entityManager = getManager();
    let chatRoomList = await entityManager.query(sql);

    chatRoomList = await Promise.all(
      chatRoomList.map(async (e) => {
        // xử lý case ACCEPT_JOIN_GROUP thì thông tin lưu trong message là của owner, cần hiển thị member joined
        if (e.notiType == QUEUE_JOB.CHAT.ACCEPT_JOIN_GROUP) {
          e.lastUser = e.notiEndContent;
          delete e.notiEndContent;
        }

        // chuyển trạng thái messageStatus : pending_retry, retrying  thành in_progress
        if (
          e.messageStatus == MESSAGE_STATUS.PENDING_RETRY ||
          e.messageStatus == MESSAGE_STATUS.RETRYING
        ) {
          e.messageStatus = MESSAGE_STATUS.IN_PROGRESS;
        }

        // get url if message type is file
        if (MESSAGE_FILE_TYPE.includes(e.type)) {
          e.file = '';
          if (e.messageStatus === MESSAGE_STATUS.COMPLETED) {
            const { url } = await this.messageService.getFileMesageInfo(
              e.content,
            );
            e.file = url;
          }
          e.content = '';
        }

        // không show thông tin khi member chưa join room
        if (e.memberStatus != MEMBER_IN_ROOM_STATUS.JOINED) {
          e.type = undefined;
          e.content = undefined;
          e.file = undefined;
          e.downloadUrl = undefined;
          e.lastUser = undefined;
          // e.lastPostTime = undefined;
          e.lastViewedAt = undefined;
          e.isPinned = undefined;
          e.muteDuration = undefined;
          e.toAddress = undefined;
          e.tokenSymbol = undefined;
          e.amount = undefined;
          e.notiType = undefined;
          e.notiMidContent = undefined;
          e.notiEndContent = undefined;
          e.fileInfo = undefined;
        }

        if (e?.roomAvatar && NumberTool.isStringNumber(e.roomAvatar)) {
          e.roomAvatar = await this.fileService.getFileUrl(+e.roomAvatar);
        } else {
          e.roomAvatar = '';
        }

        if (!e.isGroup) {
          const oppositeMember = await this.getOppositeMemberOfRoom(
            ctx,
            e.id,
            ctx.user.id,
          );
          e.isUserBlocked = oppositeMember.isBlocked;
        }

        return e;
      }),
    );

    // tranform amount to decimal for transaction history
    const tokenList = await this.userTokenService.getAllTokenFromNetwork(
      networkId,
    );
    chatRoomList.forEach((e) => {
      if (e.amount) {
        const token = tokenList.find(
          (x) => x.tokenSymbol.toLowerCase() == e.tokenSymbol?.toLowerCase(),
        );
        if (token) {
          e.amount = this.blockchainService
            .formatPoint(e.amount, token.tokenDecimal)
            .toString();
        } else {
          e.amount = null;
        }
      }
    });
    const count = chatRoomList.length;

    return {
      chats: plainToClass(SearchChatRoomOutput, <any[]>chatRoomList, {
        excludeExtraneousValues: true,
      }),
      count,
    };
  }

  async getPinnedChatRoomList(
    ctx: RequestContext,
    userId: number,
    offset: number,
    limit: number,
  ): Promise<{
    chats: SearchChatRoomOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.getPinnedChatRoomList.name} was called`);
    const sql = `select 
        cr.id,
        if(
          cr.isGroup != 0, 
          cr.name ,
          (select sub.roomName from 
                 (select ifnull(nickname, displayName) as roomName 
                         from member_in_room 
                         where chatRoomId = cr.id 
                         and userId != ${userId} 
                         limit 1
                  ) sub
           ) 
        ) as roomName,
        if(
          cr.isGroup != 0, 
          cr.avatar,
          (select u.avatar 
                  from users u  
                  where u.id = (select userId 
                                        from member_in_room
                                        where chatRoomId = cr.id 
                                        and userId != ${userId}
                                        limit 1)
                  limit 1
           )       
        ) as roomAvatar,
        m.type,
        m.content,
        m.file,
        m.downloadUrl,
        if(m.userId = ${userId}, '${DISPLAY_ON_MY_SELF}', ifnull(mir2.nickname , mir2.displayName)) as lastUser,
        m.createdAt as lastPostTime,
        mir.lastViewedAt,
        cr.isGroup,
        mir.isPinned,
        mir.muteDuration    
        from member_in_room mir
        inner join chat_room cr on cr.id = mir.chatRoomId and cr.status = '${CHAT_ROOM_STATUS.DEPLOYED}'
        left outer join messages m on m.chatRoomId  = cr.id 
              and m.status = '${MESSAGE_STATUS.COMPLETED}'
              and m.createdAt = (select max(createdAt) 
                                       from messages 
                                       where messages.status = '${MESSAGE_STATUS.COMPLETED}'
                                       and messages.chatRoomId = cr.id
                                )
        left outer join member_in_room mir2 on mir2.chatRoomId = cr.id and mir2.userId = m.userId  
        where mir.status = '${MEMBER_IN_ROOM_STATUS.JOINED}' 
        and mir.userId = ${userId}
        and mir.isPinned != 0
        order by m.createdAt desc
        limit ${limit}
        offset ${offset}`;

    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const chatRoomList = await slaveQueryRunner.query(sql);
    const entityManager = getManager();
    let chatRoomList = await entityManager.query(sql);
    const count = chatRoomList.length;

    chatRoomList = await Promise.all(
      chatRoomList.map(async (e) => {
        if (e?.roomAvatar && NumberTool.isStringNumber(e.roomAvatar)) {
          e.roomAvatar = await this.fileService.getFileUrl(+e.roomAvatar);
        }

        return e;
      }),
    );

    return {
      chats: plainToClass(SearchChatRoomOutput, <any[]>chatRoomList, {
        excludeExtraneousValues: true,
      }),
      count,
    };
  }

  async searchChatRoom(
    ctx: RequestContext,
    userId: number,
    query: SearchChatParamsDto,
  ): Promise<{
    chats: SearchChatRoomOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.getChatRoomList.name} was called`);
    let sql = `select distinct
    cr.id,
    if(
      cr.isGroup != 0, 
      cr.name ,
      (select ifnull(uc2.name , u.name) as name
        from user_wallet uw
        inner join users u on u.id = uw.userId
        left join user_contact uc2 on uc2.userId = ${userId} and lower(uc2.address) = lower(uw.address)
        where lower(uw.address) = lower((select walletAddress 
                            from member_in_room
                            where chatRoomId = cr.id 
                            and userId != ${userId}
                            limit 1))
        limit 1
      )     
    ) as roomName,
    if(
      cr.isGroup != 0, 
      cr.avatar,
      (select ifnull(uc2.avatar, u.avatar) as avatar
        from user_wallet uw
        inner join users u on u.id = uw.userId
        left join user_contact uc2 on uc2.userId = ${userId}  and lower(uc2.address) = lower(uw.address)
        where lower(uw.address) = lower((select walletAddress 
                            from member_in_room
                            where chatRoomId = cr.id 
                            and userId != ${userId} 
                            limit 1))
        limit 1
      )      
    ) as roomAvatar,
    m.type,
    m.content,
    m.file,
    m.downloadUrl,
    if(m.userId = ${userId}, '${DISPLAY_ON_MY_SELF}', ifnull(uc.name, u2.name)) as lastUser,
    m.createdAt as lastPostTime,
    mir.lastViewedAt,
    cr.isGroup,
    mir.isPinned,
    mir.muteDuration,
    mir.status as memberStatus,
    cr.status as chatRoomSatus,
    m.status as messageStatus,
    cr.networkId,
    if(cr.ownerId = ${userId}, 1, 0) as isOwner,
    m.toAddress,
    m.tokenSymbol,
    m.amount,
    m.notiType,
    m.notiMidContent,
    m.notiEndContent,
    if(mir.status = '${MEMBER_IN_ROOM_STATUS.INVITED}', 1, 0) as isInvitedMember,
    if(cr.isGroup = 0, (select walletAddress 
      from member_in_room
      where chatRoomId = cr.id 
      and userId != ${userId} 
      limit 1), null) as walletAddress,
    (case when rnt2.status in ( '${MESSAGE_STATUS.IN_PROGRESS}', 
                                '${MESSAGE_STATUS.PENDING_RETRY}', 
                                '${MESSAGE_STATUS.RETRYING}') then '${MESSAGE_STATUS.IN_PROGRESS}'
          when rnt2.status = '${MESSAGE_STATUS.FAILED}' then '${MESSAGE_STATUS.FAILED}'
     end) as leavingStatus     
    from member_in_room mir
    inner join chat_room cr on cr.id = mir.chatRoomId and (cr.status != '${CHAT_ROOM_STATUS.CREATED}' or cr.ownerId = ${userId})
    left outer join (
      select distinct m2.*,
        t.toAddress, t.tokenSymbol, t.amount, 
        ifnull(rat.type, rnt.type) as notiType,
        (case when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.CREATE_GROUP_CHAT}' 
                 then '${IN_CHAT_NOTIFICATION_MID_CONTENT.CREATED_THE_GROUP}'
            when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.REDEPLOY_GROUP_CHAT}' 
                 then '${IN_CHAT_NOTIFICATION_MID_CONTENT.CREATED_THE_GROUP}'
            when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.CHANGE_GROUP_NAME}' 
                 then '${IN_CHAT_NOTIFICATION_MID_CONTENT.CHANGED_GROUP_NAME_TO}'
            when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.LEAVE_ROOM}' 
                 then '${IN_CHAT_NOTIFICATION_MID_CONTENT.LEFT_THE_GROUP}'
            when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.ACCEPT_JOIN_GROUP}' 
                 then '${IN_CHAT_NOTIFICATION_MID_CONTENT.JOINED_THE_GROUP}'
            when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.REMOVE_MEMBERS}' 
                 then '${IN_CHAT_NOTIFICATION_MID_CONTENT.REMOVED}'
            when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.SET_ADMIN}' 
                 then '${IN_CHAT_NOTIFICATION_MID_CONTENT.SET_ADMIN_ROLE_TO}'
            when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.REMOVE_ADMIN}' 
                 then '${IN_CHAT_NOTIFICATION_MID_CONTENT.REMOVED_ADMIN_ROLE_FROM}'
        end) as notiMidContent,
        (case when ifnull(rat.type, rnt.type) = '${QUEUE_JOB.CHAT.CHANGE_GROUP_NAME}' 
                 then rat.data
            when ifnull(rat.type, rnt.type) in ('${QUEUE_JOB.CHAT.REMOVE_MEMBERS}',
                                                '${QUEUE_JOB.CHAT.ACCEPT_JOIN_GROUP}',  
                                                '${QUEUE_JOB.CHAT.SET_ADMIN}', 
                                                '${QUEUE_JOB.CHAT.REMOVE_ADMIN}')  
                 then   (
                         select if(u2.id = ${userId}, '${DISPLAY_ON_MY_SELF}' , ifnull(uc2.name, u2.name)) as data
                         from user_wallet uw
                         inner join users u2 on u2.id = uw.userId
                         left outer join user_contact uc2 on uc2.userId = ${userId} and lower(uc2.address) = lower(rnt.walletAddress)
                         where lower(uw.address) = lower(rnt.walletAddress)
                         limit 1)
        end) as notiEndContent
        from messages m2
        left outer join transaction t on t.id = m2.transactionId 
        left outer join room_action_tx rat on rat.messageId = m2.id and rat.id = (select max(id) from room_action_tx where messageId = m2.id)
        left outer join room_notification_tx rnt on rnt.messageId = m2.id and rnt.id = (select max(id) from room_notification_tx where messageId = m2.id)
      ) m on m.chatRoomId  = cr.id 
         and if(m.userId = ${userId} 
               and m.type != '${MESSAGE_TYPE.ROOM_ACTION}' 
               and m.type != '${MESSAGE_TYPE.ROOM_NOTIFICATION}', 
            m.status != '${MESSAGE_STATUS.HIDDEN}', 
            m.status = '${MESSAGE_STATUS.COMPLETED}') 
          and m.id = (select max(messages.id) 
                                   from messages
                                   left outer join remove_message rm on rm.messageId = messages.id and rm.userId = ${userId}  
                                   where if(messages.userId = ${userId} and messages.type != '${MESSAGE_TYPE.ROOM_ACTION}' and messages.type != '${MESSAGE_TYPE.ROOM_NOTIFICATION}', 
                                    messages.status != '${MESSAGE_STATUS.HIDDEN}', 
                                    messages.status = '${MESSAGE_STATUS.COMPLETED}') 
                                   and messages.chatRoomId = cr.id
                                   and rm.id is null
                            )
    left outer join room_notification_tx rnt2 on rnt2.id = (select max(id)
                                                                from room_notification_tx
                                                                where chatRoomId = cr.id 
                                                                and walletAddress = mir.walletAddress
                                                              )
                                                and rnt2.type = '${QUEUE_JOB.CHAT.LEAVE_ROOM}' 
                                                and (rnt2.status != '${MESSAGE_STATUS.FAILED}' or rnt2.updatedAt >= m.updatedAt)                                                
    left outer join users u2 on u2.id = m.userId 
    left outer join user_contact uc on uc.userId = ${userId} and lower(uc.address) = lower(m.walletAddress)   
    where mir.status in ('${MEMBER_IN_ROOM_STATUS.JOINED}', '${MEMBER_IN_ROOM_STATUS.INVITED}', '${MEMBER_IN_ROOM_STATUS.PENDING_APPROVAL}')   
    and mir.userId = ${userId}
    and cr.networkId = ${query.networkId}
    and if(cr.ownerId = ${userId}, cr.status != '${CHAT_ROOM_STATUS.CANCEL}', cr.status IN ('${CHAT_ROOM_STATUS.DEPLOYED}', '${CHAT_ROOM_STATUS.BLOCKED}'))
    and (cr.isGroup != 0 or (m.type != '${MESSAGE_TYPE.ROOM_NOTIFICATION}' and m.type != '${MESSAGE_TYPE.ROOM_ACTION}' and m.type != '${MESSAGE_TYPE.SYSTEM}')) `;

    if (query.name) {
      sql += ` and lower(if(
            cr.isGroup != 0, 
            cr.name ,
            (select ifnull(uc2.name , u.name) as name
              from user_wallet uw
              inner join users u on u.id = uw.userId
              left join user_contact uc2 on uc2.userId = ${userId} and lower(uc2.address) = lower(uw.address)
              where lower(uw.address) = lower((select walletAddress 
                                from member_in_room
                                where chatRoomId = cr.id 
                                and userId != ${userId}
                                limit 1))
              limit 1
            )
          )) like lower('%${query.name}%')`;
    }

    if (query.address) {
      sql += ` and lower('${query.address}') in (select lower(walletAddress) 
                                                     from member_in_room 
                                                     where chatRoomId = cr.id)`;
    }

    sql += ` order by mir.isPinned desc, m.createdAt desc
        limit ${query.limit}
        offset ${query.offset}`;
    // console.log('sql_____________:',sql);

    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const chatRoomList = await slaveQueryRunner.query(sql);
    const entityManager = getManager();
    let chatRoomList = await entityManager.query(sql);

    chatRoomList = await Promise.all(
      chatRoomList.map(async (e) => {
        if (e.notiType == QUEUE_JOB.CHAT.ACCEPT_JOIN_GROUP) {
          e.lastUser = e.notiEndContent;
          delete e.notiEndContent;
        }

        // chuyển trạng thái messageStatus : pending_retry, retrying  thành in_progress
        if (
          e.messageStatus == MESSAGE_STATUS.PENDING_RETRY ||
          e.messageStatus == MESSAGE_STATUS.RETRYING
        ) {
          e.messageStatus = MESSAGE_STATUS.IN_PROGRESS;
        }

        // get url if message type is file
        if (MESSAGE_FILE_TYPE.includes(e.type)) {
          e.file = '';
          if (e.messageStatus === MESSAGE_STATUS.COMPLETED) {
            const { url } = await this.messageService.getFileMesageInfo(
              e.content,
            );
            e.file = url;
          }
          e.content = '';
        }

        // không show thông tin khi member chưa join room
        if (e.memberStatus != MEMBER_IN_ROOM_STATUS.JOINED) {
          e.type = undefined;
          e.content = undefined;
          e.file = undefined;
          e.downloadUrl = undefined;
          e.lastUser = undefined;
          // e.lastPostTime = undefined;
          e.lastViewedAt = undefined;
          e.isPinned = undefined;
          e.muteDuration = undefined;
          e.toAddress = undefined;
          e.tokenSymbol = undefined;
          e.amount = undefined;
          e.notiType = undefined;
          e.notiMidContent = undefined;
          e.notiEndContent = undefined;
          e.fileInfo = undefined;
        }

        if (e?.roomAvatar && NumberTool.isStringNumber(e.roomAvatar)) {
          e.roomAvatar = await this.fileService.getFileUrl(+e.roomAvatar);
        }

        if (!e.isGroup) {
          const oppositeMember = await this.getOppositeMemberOfRoom(
            ctx,
            e.id,
            ctx.user.id,
          );
          e.isUserBlocked = oppositeMember.isBlocked;
        }

        return e;
      }),
    );

    // tranform amount to decimal for transaction history
    const tokenList = await this.userTokenService.getAllTokenFromNetwork(
      query.networkId,
    );
    chatRoomList.forEach((e) => {
      if (e.amount) {
        const token = tokenList.find(
          (x) => x.tokenSymbol.toLowerCase() == e.tokenSymbol?.toLowerCase(),
        );
        if (token) {
          e.amount = this.blockchainService
            .formatPoint(e.amount, token.tokenDecimal)
            .toString();
        } else {
          e.amount = null;
        }
      }
    });
    const count = chatRoomList.length;

    return {
      chats: plainToClass(SearchChatRoomOutput, <any[]>chatRoomList, {
        excludeExtraneousValues: true,
      }),
      count,
    };
  }

  async findOrAddSingleChatRoom(
    ctx: RequestContext,
    userId: number,
    input: AddSingleChatRoomInput,
  ): Promise<ChatRoomOutput> {
    this.logger.log(ctx, `${this.findOrAddSingleChatRoom.name} was called`);
    const users = await this.getInfoToCreateRoomSingleById(
      userId,
      input.address,
    );
    if (!users || users.length == 0) {
      throw new Error('User not found!');
    } else if (!users[0].address) {
      throw new Error('Default wallet not found!');
    } else if (!users[0].rpcEndpoint) {
      throw new Error('Default network not found!');
    } else if (!users[0].isEnableAutosignMessage) {
      throw new Error('Please enable Auto sign first!');
    }
    const owner = users[0];

    const oldChatRoom = await this.findSingleChatRoomByAddressAndNetwork(
      owner.address,
      input.address,
      input.networkId,
    );
    if (oldChatRoom.id) {
      return plainToClass(ChatRoomOutput, oldChatRoom, {
        excludeExtraneousValues: true,
      });
    }

    const chatPerson = await this.getInfoToCreateRoomSingleByAddress(
      input.address,
      owner.address,
    );
    if (!chatPerson.userId) {
      throw new Error('Address of chat person is not valid!');
    }

    const chatRoom = plainToClass(ChatRoom, {
      ownerId: owner.id,
      name: null,
      avatar: null,
      isGroup: false,
      status: CHAT_ROOM_STATUS.DEPLOYED,
      networkId: input.networkId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const newChatRoom = await this.chatRoomRepository.save(chatRoom);

    const ownerMember = {
      chatRoomId: newChatRoom.id,
      userId: owner.id,
      walletAddress: owner.address,
      displayName: owner.displayName,
      nickname: chatPerson.ownerNickname,
      role: MEMBER_IN_ROOM_ROLE.OWNER,
      status: MEMBER_IN_ROOM_STATUS.JOINED,
      addedByUserId: owner.id,
      isChatArchived: false,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastViewedAt: new Date(),
    };
    const newOwnerMember = await this.memberInRoomService.insertMember(
      ctx,
      ownerMember,
    );

    const chatPersonMember = {
      chatRoomId: newChatRoom.id,
      userId: chatPerson.userId,
      walletAddress: chatPerson.address,
      displayName: chatPerson.displayName,
      nickname: owner.chatPersonNickname,
      role: MEMBER_IN_ROOM_ROLE.MEMBER,
      status: MEMBER_IN_ROOM_STATUS.JOINED,
      addedByUserId: owner.id,
      isChatArchived: false,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastViewedAt: new Date(),
    };
    const newChatPersonMember = await this.memberInRoomService.insertMember(
      ctx,
      chatPersonMember,
    );

    const firstMessage = await this.createFirstRoomMessage(
      ctx,
      newChatRoom.id,
      owner.id,
      owner.address,
    );

    await this.roomKeyService.createRoomKeys(newChatRoom.id);

    return plainToClass(ChatRoomOutput, newChatRoom, {
      excludeExtraneousValues: true,
    });
  }

  async getBlockedUsersWalletAddresses(userId: number): Promise<string[]> {
    const entityManager = getManager();
    const blockedUsers = await entityManager.query(`
      select user_wallet.address from user_block
      left join user_wallet on user_wallet.userId = user_block.blockedUserId
      where user_block.userId = ${userId}
      and user_block.status = 1
    `);
    return blockedUsers.map((user) => {
      return user.address.toLowerCase();
    });
  }

  async getInfoToCreateRoomSingleById(
    userId: number,
    chatPersonAddress: string,
  ) {
    const blockedWalletAddresses = await this.getBlockedUsersWalletAddresses(
      userId,
    );

    if (blockedWalletAddresses.includes(chatPersonAddress.toLowerCase())) {
      throw new Error('User is blocked!');
    }

    const sql = `select u.id, u.name as displayName, uw.address, 
      n.rpcEndpoint , us.isEnableAutosignMessage, us.gasFeeLevel,
      uc.name as chatPersonNickname 
      from users u
      inner join user_setting us on us.userId = u.id
      left join user_wallet uw on uw.id = us.useUserWalletId
      left join network n on n.id = us.useNetworkId
      left join user_contact uc on uc.userId = u.id and lower(uc.address) = lower('${chatPersonAddress}')
      where u.id = ${userId}`;
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // return slaveQueryRunner.query(sql);

    const entityManager = getManager();
    return entityManager.query(sql);
  }

  async getInfoToCreateRoomSingleByAddress(
    chatPersonAddress: string,
    ownerAddress: string,
  ) {
    const sql = `select u.id as userId, u.name as displayName, uw.address , uc.name as ownerNickname
      from user_wallet uw
      inner join users u on uw.userId = u.id
      left join user_contact uc on uc.userId = u.id and lower(uc.address) = lower('${ownerAddress}')
      where lower(uw.address) = lower('${chatPersonAddress}')`;
    // console.log('sql___________', sql) ;
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const user = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const user = await entityManager.query(sql);

    if (!user || user.length == 0) {
      return {};
    } else {
      return user[0];
    }
  }

  async findSingleChatRoomByAddressAndNetwork(
    address1: string,
    address2: string,
    networkId: number,
  ) {
    const sql = ` select cr.* 
    from chat_room cr
    inner join member_in_room mir on mir.chatRoomId = cr.id and lower(mir.walletAddress) = lower('${address1}') 
    inner join member_in_room mir2 on mir2.chatRoomId = cr.id and lower(mir2.walletAddress) = lower('${address2}')
    where cr.isGroup = 0  
    and cr.networkId = ${networkId}`;
    // console.log('sql___________', sql) ;
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const user = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const user = await entityManager.query(sql);

    if (!user || user.length == 0) {
      return {};
    } else {
      return user[0];
    }
  }

  async getRoomDetail(
    ctx: RequestContext,
    id: number,
  ): Promise<ChatRoomDetailOutput | RoomMemberDetailOutput> {
    this.logger.log(ctx, `${this.getRoomDetail.name} was called`);

    const userId = ctx?.user?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const member =
      await this.memberInRoomService.findInvitedOrJoinedMemberByUserId(
        userId,
        id,
      );
    const isUserInRoom = !!member;
    if (!isUserInRoom) {
      throw new Error('User is not in room');
    }

    const chatRoom = await this.chatRoomRepository.findOne(id);
    if (!chatRoom) {
      throw new NotFoundException('Chat room not found');
    }

    if (chatRoom.isGroup) {
      return plainToClass(
        ChatRoomDetailOutput,
        {
          ...chatRoom,
          lastViewedAt: member.lastViewedAt,
          isPinned: member.isPinned,
          muteDuration: member.muteDuration,
          memberStatus: member.status,
          isOwner: chatRoom.ownerId == userId ? 1 : 0,
        },
        {
          excludeExtraneousValues: true,
        },
      );
    }

    const oppositeMember = await this.getOppositeMemberOfRoom(ctx, id, userId);

    return {
      ...oppositeMember,
      isBlocked: chatRoom.status === CHAT_ROOM_STATUS.BLOCKED,
      isUserBlocked: oppositeMember.isBlocked,
    };
  }

  async getOppositeMemberOfRoom(
    ctx: RequestContext,
    roomId: number,
    currentUserId: number,
  ): Promise<any> {
    const oppositeMember = await this.memberInRoomService.findOppositeMember(
      currentUserId,
      roomId,
    );
    return this.memberInRoomService.getRoomMemberDetail(ctx, oppositeMember.id);
  }

  /**
   * User acccept join room
   */
  async joinRoom(
    ctx: RequestContext,
    roomId: number,
  ): Promise<RoomMemberListItemOutput> {
    this.logger.log(ctx, `${this.joinRoom.name} was called`);
    const userId = ctx.user.id;
    const invitedMember =
      await this.memberInRoomService.findInvitedMemberByUserId(userId, roomId);
    const wasUserInvited = !!invitedMember;
    if (!wasUserInvited) {
      throw new Error('User is not invited');
    }

    // check walletAddress in another progress in this chatroom
    const checkAddressInProgress =
      await this.roomNotificationTxService.checkProcessingOneAddress(
        roomId,
        invitedMember.walletAddress,
      );
    if (checkAddressInProgress === true) {
      throw new Error(
        'This action is invalid because user are currently in progress for another transaction.',
      );
    }

    const updatedMember = plainToClass(MemberInRoom, {
      ...invitedMember,
      status: MEMBER_IN_ROOM_STATUS.PENDING_APPROVAL,
      updatedAt: new Date(),
    });

    const updatedMemberDb = await this.memberInRoomService.updateMemberInRoom(
      updatedMember,
    );

    // send notification to owner
    const owner = await this.memberInRoomService.findRoomOwner(roomId);
    if (owner) {
      const notificationInfo =
        await this.memberInRoomService.getNotificationInfo(
          roomId,
          owner.userId,
          userId,
          MEMBER_IN_ROOM_STATUS.PENDING_APPROVAL,
        );
      this.sendNotificationService.addNotificationToQueue(ctx, {
        userId: owner.userId,
        type: SOCKET_TYPE.ROOM_INVITATION,
        data: {
          status: MEMBER_IN_ROOM_STATUS.PENDING_APPROVAL,
          roomId: roomId.toString(),
          action: QUEUE_JOB.CHAT.ACCEPT_INVITE,
        },
        notification: {
          title: notificationInfo.chatRoomName,
          body: `${notificationInfo.showName} has accepted your invitation`,
        },
      });
      await this.chatHelperService.sendChatQueueData({
        fromUserId: owner.userId,
        fromWalletAddress: owner.walletAddress,
        messageContents: [
          `${notificationInfo.showName} has accepted the invitation to ${notificationInfo.chatRoomName} group`,
        ],
        messageType: MESSAGE_TYPE.ROOM_NOTIFICATION,
        roomId,
        toWalletAddresses: [updatedMemberDb.walletAddress],
        jobName: QUEUE_JOB.CHAT.ACCEPT_JOIN_GROUP,
      });
    }

    return plainToClass(RoomMemberListItemOutput, updatedMemberDb, {
      excludeExtraneousValues: true,
    });
  }

  async leaveRoom(
    ctx: RequestContext,
    roomId: number,
  ): Promise<RoomMemberListItemOutput> {
    this.logger.log(ctx, `${this.leaveRoom.name} was called`);

    const userId = ctx?.user?.id;
    const member = await this.memberInRoomService.findJoinedMemberByUserId(
      userId,
      roomId,
    );
    const wasUserInRoom = !!member;

    if (!wasUserInRoom) {
      throw new Error('User is not in room');
    }

    // check walletAddress in another progress in this chatroom
    const checkAddressInProgress =
      await this.roomNotificationTxService.checkProcessingOneAddress(
        roomId,
        member.walletAddress,
      );
    if (checkAddressInProgress === true) {
      throw new Error(
        'This action is invalid because user are currently in progress for another transaction.',
      );
    }

    await this.chatHelperService.sendChatQueueData({
      jobName: QUEUE_JOB.CHAT.LEAVE_ROOM,
      fromUserId: userId,
      roomId,
      fromWalletAddress: member.walletAddress,
      toWalletAddresses: [member.walletAddress],
      messageType: MESSAGE_TYPE.ROOM_NOTIFICATION,
      messageContents: [
        `${member.nickname || member.displayName} has left the room`,
      ],
    });

    return plainToClass(RoomMemberListItemOutput, member, {
      excludeExtraneousValues: true,
    });
  }

  async updateChatRoom(
    ctx: RequestContext,
    input: UpdateChatRoomInput,
  ): Promise<ChatRoomOutput> {
    this.logger.log(ctx, `${this.updateChatRoom.name} was called`);
    this.logger.log(ctx, `calling ${ChatRoomRepository.name}.getById`);
    const ownerId = ctx.user.id;
    const owner = await this.memberInRoomService.findJoinedMemberByUserId(
      ownerId,
      input.id,
    );
    if (owner.role !== MEMBER_IN_ROOM_ROLE.OWNER) {
      throw new Error('User is not owner');
    }

    const oldChatRoom = await this.chatRoomRepository.getById(input.id);
    if (!oldChatRoom) {
      throw new NotFoundException('This chat room does not exist!');
    }

    let updateChatRoomPayload = plainToClass(ChatRoom, {
      ...oldChatRoom,
    });

    if (oldChatRoom.name !== input.name) {
      console.log('Go here');
      await this.chatHelperService.sendChatQueueData({
        roomId: oldChatRoom.id,
        fromUserId: ownerId,
        fromWalletAddress: owner.walletAddress,
        messageType: MESSAGE_TYPE.ROOM_ACTION,
        messageContents: [`has changed group name to`],
        toWalletAddresses: [owner.walletAddress],
        jobName: QUEUE_JOB.CHAT.CHANGE_GROUP_NAME,
        data: input.name,
      });
    } else {
      updateChatRoomPayload = {
        ...oldChatRoom,
        ...plainToClass(ChatRoom, input),
        updatedAt: new Date(),
      };

      await this.chatRoomRepository.update(
        updateChatRoomPayload.id,
        updateChatRoomPayload,
      );
    }

    return plainToClass(ChatRoomOutput, updateChatRoomPayload, {
      excludeExtraneousValues: true,
    });
  }

  async resendChatRoom(
    ctx: RequestContext,
    id: number,
  ): Promise<ChatRoomOutput> {
    this.logger.log(ctx, `${this.resendChatRoom.name} was called`);
    this.logger.log(ctx, `calling ${ChatRoomRepository.name}.getById`);
    const userId = ctx.user.id;

    const oldChatRoom = await this.chatRoomRepository.getById(id);
    if (!oldChatRoom) {
      throw new NotFoundException('This chat room does not exist!');
    }
    if (oldChatRoom.status != CHAT_ROOM_STATUS.FAILED) {
      throw new Error('This chat room is not deployed fail!');
    }

    const owner = await this.memberInRoomService.findJoinedMemberByUserId(
      userId,
      oldChatRoom.id,
    );
    if (owner?.role !== MEMBER_IN_ROOM_ROLE.OWNER) {
      throw new Error('User is not owner');
    }

    const newUpdatedCChatRoom: ChatRoom = {
      ...oldChatRoom,
      status: CHAT_ROOM_STATUS.CREATED,
      updatedAt: new Date(),
    };

    this.logger.log(ctx, `calling ${ChatRoomRepository.name}.update chat-room`);
    await this.chatRoomRepository.update(
      newUpdatedCChatRoom.id,
      newUpdatedCChatRoom,
    );

    this.chatHelperService.sendChatQueueData({
      fromUserId: owner.userId,
      fromWalletAddress: owner.walletAddress,
      jobName: QUEUE_JOB.CHAT.REDEPLOY_GROUP_CHAT,
      messageContents: [`has created a new group`],
      messageType: MESSAGE_TYPE.ROOM_ACTION,
      roomId: oldChatRoom.id,
      toWalletAddresses: [owner.walletAddress],
      data: '',
    });

    return plainToClass(ChatRoomOutput, newUpdatedCChatRoom, {
      excludeExtraneousValues: true,
    });
  }

  async removeFailChatRoom(
    ctx: RequestContext,
    id: number,
  ): Promise<ChatRoomOutput> {
    this.logger.log(ctx, `${this.removeFailChatRoom.name} was called`);
    this.logger.log(ctx, `calling ${ChatRoomRepository.name}.getById`);
    const userId = ctx.user.id;

    const oldChatRoom = await this.chatRoomRepository.getById(id);
    if (!oldChatRoom) {
      throw new NotFoundException('This chat room does not exist!');
    }
    if (oldChatRoom.status != CHAT_ROOM_STATUS.FAILED) {
      throw new Error('This chat room is not deployed fail!');
    }

    const isRoomOwner = await this.memberInRoomService.isRoomOwner(
      userId,
      oldChatRoom.id,
    );
    if (!isRoomOwner) {
      throw new Error('User is not owner');
    }
    const newUpdatedCChatRoom: ChatRoom = {
      ...oldChatRoom,
      status: CHAT_ROOM_STATUS.CANCEL,
      updatedAt: new Date(),
    };

    this.logger.log(ctx, `calling ${ChatRoomRepository.name}.update chat-room`);
    await this.chatRoomRepository.update(
      newUpdatedCChatRoom.id,
      newUpdatedCChatRoom,
    );

    return plainToClass(ChatRoomOutput, newUpdatedCChatRoom, {
      excludeExtraneousValues: true,
    });
  }

  async addGroupChatRoom(
    ctx: RequestContext,
    userId: number,
    input: AddGroupChatRoomInput,
  ): Promise<ChatRoomOutput> {
    this.logger.log(ctx, `${this.addGroupChatRoom.name} was called`);

    const users = await this.getUserForCreateChatRoomById(userId);

    if (!users || users.length == 0) {
      throw new Error('User not found!');
    } else if (!users[0].address) {
      throw new Error('Default wallet not found!');
    } else if (!users[0].rpcEndpoint) {
      throw new Error('Default network not found!');
    } else if (!users[0].isEnableAutosignMessage) {
      throw new Error('Please enables Auto sign first!');
    }
    const owner = users[0];

    if (input.listAddress.length > MAX_MEMBER_PER_GROUP) {
      throw new Error(
        `The amount of members must be less than ${MAX_MEMBER_PER_GROUP}!`,
      );
    }

    const invitedAddressList = input?.listAddress?.filter(
      (address: string) => address !== owner.address,
    );

    if (invitedAddressList.length == 0) {
      throw new Error('Please add at least one other member!');
    }

    const chatRoom = plainToClass(ChatRoom, {
      ownerId: owner.id,
      name: input.name || `New group created by ${owner.displayName}`,
      avatar: input.avatar,
      isGroup: true,
      status: CHAT_ROOM_STATUS.CREATED,
      networkId: input.networkId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const newChatRoom = await this.chatRoomRepository.save(chatRoom);

    const ownerMember = {
      chatRoomId: newChatRoom.id,
      userId: owner.id,
      walletAddress: owner.address,
      displayName: owner.displayName,
      role: MEMBER_IN_ROOM_ROLE.OWNER,
      status: MEMBER_IN_ROOM_STATUS.JOINED,
      addedByUserId: owner.id,
      isChatArchived: false,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastViewedAt: new Date(),
    };
    // TODO: Need to refactor using transaction
    const createdRoomMessage = {
      chatRoomId: newChatRoom.id,
      userId: owner.id,
      walletAddress: owner.address,
      type: MESSAGE_TYPE.ROOM_ACTION,
      content: `created the group`,
      isPinned: false,
      status: MESSAGE_STATUS.COMPLETED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await Promise.all([
      this.roomKeyService.createRoomKeys(newChatRoom.id),
      this.memberInRoomService.insertMember(ctx, ownerMember),
      this.messageService.createSystemMessage({
        userId: owner.id,
        walletAddress: owner.address,
        chatRoomId: newChatRoom.id,
        content: `Everything sent on Wallet
        Messenger will be encrypted
        and only you and your friends
        can see the messages.`,
        status: MESSAGE_STATUS.COMPLETED,
      }),
    ]);

    await Promise.all(
      invitedAddressList.map(async (addresss: string) =>
        this.createMemberInRoom(
          ctx,
          addresss,
          owner.address,
          owner.displayName,
          newChatRoom,
        ),
      ),
    );

    await this.chatHelperService.sendChatQueueData({
      roomId: newChatRoom.id,
      fromUserId: owner.id,
      fromWalletAddress: owner.address,
      messageContents: [`has created a new group`],
      messageType: MESSAGE_TYPE.ROOM_ACTION,
      toWalletAddresses: [],
      jobName: QUEUE_JOB.CHAT.CREATE_GROUP_CHAT,
      data: input.name,
    });

    if (newChatRoom?.avatar && NumberTool.isStringNumber(newChatRoom.avatar)) {
      newChatRoom.avatar = await this.fileService.getFileUrl(
        +newChatRoom.avatar,
      );
    }

    return plainToClass(ChatRoomOutput, newChatRoom, {
      excludeExtraneousValues: true,
    });
  }

  async getUserForCreateChatRoomById(userId: number) {
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

  async getUserForCreateChatRoomByAddress(
    address: string,
    ownerAddress: string,
  ) {
    const sql = `select u.id as userId, u.name as displayName, uw.address, uc.name as ownerNickname 
      from user_wallet uw
      inner join users u on uw.userId = u.id
      left join user_contact uc on uc.userId = u.id and lower(uc.address) = lower('${ownerAddress}')
      where lower(uw.address) = lower('${address}')`;
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const user = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const user = await entityManager.query(sql);

    if (!user || user.length == 0) {
      return {};
    } else {
      return user[0];
    }
  }

  async createMemberInRoom(
    ctx: RequestContext,
    address: string,
    ownerAddress: string,
    ownerDisplayName: string,
    chatRoom: ChatRoom,
  ) {
    const memberInfo = await this.getUserForCreateChatRoomByAddress(
      address,
      ownerAddress,
    );
    if (!memberInfo || !memberInfo.userId) {
      return {};
    } else {
      const memberInRoom = {
        chatRoomId: chatRoom.id,
        userId: memberInfo.userId,
        walletAddress: memberInfo.address,
        displayName: memberInfo.displayName,
        role: MEMBER_IN_ROOM_ROLE.MEMBER,
        status: MEMBER_IN_ROOM_STATUS.INVITED,
        addedByUserId: chatRoom.ownerId,
        isChatArchived: false,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastViewedAt: new Date(),
      };

      const addMember = await this.memberInRoomService.insertMember(
        ctx,
        memberInRoom,
      );

      // send notification (send after create group)
      // const ownerShowName = memberInfo.ownerNickname || ownerDisplayName;
      // this.sendNotificationService.addNotificationToQueue(ctx, {
      //   userId: memberInfo.userId,
      //   type: SOCKET_TYPE.ROOM_INVITATION,
      //   data: {
      //     status: MEMBER_IN_ROOM_STATUS.INVITED,
      //     roomId: chatRoom.id.toString(),
      //     action: QUEUE_JOB.CHAT.INVITE_MEMBER
      //   },
      //   notification: {
      //     title: `${chatRoom.name}`,
      //     body: `${ownerShowName} has invited you to join the group`,
      //   },
      // });

      return addMember;
    }
  }

  async markAsUnreadChatRoom(
    ctx: RequestContext,
    roomId: number,
  ): Promise<void> {
    this.logger.log(ctx, `${this.markAsUnreadChatRoom.name} was called`);
    const userId = ctx?.user?.id;

    const roomLatestMessage =
      await this.messageService.getLatestMessageByRoomId(roomId);
    const memberInRoom =
      await this.memberInRoomService.findJoinedMemberByUserId(userId, roomId);

    if (!memberInRoom) {
      throw new Error('Member not found!');
    }

    memberInRoom.lastViewedAt = moment(roomLatestMessage.createdAt)
      .subtract('1', 'minute')
      .toDate();

    await this.memberInRoomService.updateMemberInRoom(memberInRoom);
  }

  async rejectInvitation(
    ctx: RequestContext,
    roomId: number,
  ): Promise<RoomMemberListItemOutput> {
    this.logger.log(ctx, `${this.rejectInvitation.name} was called`);
    const userId = ctx.user.id;

    const member = await this.memberInRoomService.findInvitedMemberByUserId(
      userId,
      roomId,
    );
    const wasUserInvited = !!member;
    if (!wasUserInvited) {
      throw new Error('You was not invited!');
    }

    // check walletAddress in another progress in this chatroom
    const checkAddressInProgress =
      await this.roomNotificationTxService.checkProcessingOneAddress(
        roomId,
        member.walletAddress,
      );
    if (checkAddressInProgress === true) {
      throw new Error(
        'This action is invalid because user are currently in progress for another transaction.',
      );
    }

    member.status = MEMBER_IN_ROOM_STATUS.CANCEL;
    const updatedMemberDb = await this.memberInRoomService.updateMemberInRoom(
      member,
    );

    // send notification to owner
    const owner = await this.memberInRoomService.findRoomOwner(roomId);
    if (owner) {
      const notificationInfo =
        await this.memberInRoomService.getNotificationInfo(
          roomId,
          owner.userId,
          userId,
          MEMBER_IN_ROOM_STATUS.CANCEL,
        );
      this.sendNotificationService.addNotificationToQueue(ctx, {
        userId: owner.userId,
        type: SOCKET_TYPE.ROOM_INVITATION,
        data: {
          status: MEMBER_IN_ROOM_STATUS.CANCEL,
          roomId: roomId.toString(),
          action: QUEUE_JOB.CHAT.REJECT_JOIN_GROUP,
        },
        notification: {
          title: notificationInfo.chatRoomName,
          body: `${notificationInfo.showName} has rejected your invitation`,
        },
      });
    }

    return plainToClass(RoomMemberListItemOutput, updatedMemberDb, {
      excludeExtraneousValues: true,
    });
  }

  async getInvitedChatRoomList(
    ctx: RequestContext,
    userId: number,
    offset: number,
    limit: number,
  ): Promise<{
    chats: ChatRoomOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.getInvitedChatRoomList.name} was called`);
    const sql = `select cr.*, mir.createdAt as memberCreatedAt 
    from chat_room cr
    inner join member_in_room mir on mir.chatRoomId = cr.id 
               and mir.userId = ${userId}
               and (mir.status = '${MEMBER_IN_ROOM_STATUS.INVITED}' or mir.status = '${MEMBER_IN_ROOM_STATUS.PENDING_APPROVAL}')
    where cr.status = '${CHAT_ROOM_STATUS.DEPLOYED}'
         or cr.status = '${CHAT_ROOM_STATUS.PAUSED}'
    order by memberCreatedAt desc
    limit ${limit}
    offset ${offset}`;
    console.log('sql_____________:', sql);
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const chatRoomList = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const chatRoomList = await entityManager.query(sql);

    const count = chatRoomList.length;

    return {
      chats: plainToClass(ChatRoomOutput, <any[]>chatRoomList, {
        excludeExtraneousValues: true,
      }),
      count,
    };
  }

  async createFirstRoomMessage(
    ctx: RequestContext,
    chatRoomId: number,
    userId: number,
    walletAddress: string,
  ) {
    const createdRoomMessage = {
      chatRoomId: chatRoomId,
      userId: userId,
      walletAddress: walletAddress,
      type: MESSAGE_TYPE.SYSTEM,
      content: `Everything sent on Wallet
      Messenger will be encrypted
      and only you and your friends
      can see the messages.`,
      isPinned: false,
      status: MESSAGE_STATUS.COMPLETED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return await this.messageService.insertMessage(ctx, createdRoomMessage);
  }

  async getRoomById(id: number): Promise<ChatRoom> {
    return await this.chatRoomRepository.findOne(id);
  }
}
