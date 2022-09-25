import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ChatRoomService } from 'src/chat-room/services/chat-room.service';
import { MemberInRoomService } from 'src/member-in-room/services/member-in-room.service';
import { MessageService } from 'src/message/services/message.service';
import { NetworkService } from 'src/network/services/network.service';

/**
 * This guard is used to check if the chat network is supported by our system.
 * All routes which have to do with the chat feature should be guarded by this guard.
 * !! This guard should be up-to-date with the latest version of the chat apis. Any updates to the chat apis should be reflected as well.
 */

@Injectable()
export class ChatNetworkGuard implements CanActivate {
  private urlMapping = {
    message: '/message/',
    'chat-room': '/chat-room/',
    'member-in-room': '/member-in-room/',
    'remove-message': '/remove-message/',
    'spam-report': '/spam-report/',
    'room-key': '/room_key/',
  };

  constructor(
    private readonly networkService: NetworkService,
    private readonly chatRoomService: ChatRoomService,
    private readonly messageService: MessageService,
    private readonly memberInRoomService: MemberInRoomService,
    private readonly reflector: Reflector,
  ) {}

  private async getRoomId(req: any): Promise<number> {
    const { url = '', params = {}, body = {}, method, query = {} } = req;
    console.log('req', req);

    if (url.includes(this.urlMapping['chat-room'])) {
      /**
       * There are 4 types of request for this route:
       * One has the networkId in the query, since we just only care about the roomId in this case, the network id will be pre-check in the getNetworkId method.
       * The second one has the networkId in the body, in that case, we will precheck in the getNetworkId method
       *
       * The third one accepts the id in the params, that id is the id of chat room
       * The fourth one get the id in the body which is the id of chat room
       */
      return params?.id || body?.id;
    }
    if (url.includes(this.urlMapping.message)) {
      /**
       * There are 4 types of request for this route
       * One has the id in the params which is the id of message
       * The second one has the roomId in the params
       * The thrid one has the roomId or chatRoomId in the body
       * The last one has the roomId in the query
       */
      if (params?.id) {
        const message = await this.messageService.findMessageById(+params.id);
        return message?.chatRoomId;
      }

      console.log('body?.chatRoomI', body?.chatRoomId);

      return (
        params?.roomId || body?.chatRoomId || body?.roomId || query?.roomId
      );
    }
    if (url.includes(this.urlMapping['member-in-room'])) {
      /**
       * There are 5 types of request for this route
       * One has the id in the params which is the id of member in room
       * The second one has the id in the body which is the id of chat room
       * The third one has the roomId in the params
       * The fourth has the roomId in the query
       * The last one has the roomId in the body
       */
      if (params?.id) {
        if (method === 'PUT') {
          return params.id;
        }
        const memberInRoomId = params.id;
        const member = await this.memberInRoomService.getById(+memberInRoomId);
        return member?.chatRoomId;
      }
      return body?.id || body?.roomId || params?.roomId || query?.roomId;
    }

    if (url.includes(this.urlMapping['remove-message'])) {
      /**
       * Currently we only have 1 type of request for this route
       * One has the messageId in the body
       */
      const messageId = body?.messageId;
      if (messageId) {
        const message = await this.messageService.findMessageById(+messageId);
        return message?.chatRoomId;
      }
    }

    if (url.includes(this.urlMapping['spam-report'])) {
      /**
       * Currently we only have 1 type of request for this route
       * One has the messageId in the body
       */
      const messageId = body?.messageId;
      if (messageId) {
        const message = await this.messageService.findMessageById(+messageId);
        return message?.chatRoomId;
      }
    }

    if (url.includes(this.urlMapping['room-key'])) {
      /**
       * Currently we only have 1 type of request for this route
       * One has the roomId in the params
       */
      console.log('params?.roomId', params?.roomId);
      return params?.roomId;
    }

    return 0;
  }

  private async getNetworkId(req: any): Promise<number> {
    const { url = '', query = {}, body = {} } = req;
    if (url.includes(this.urlMapping['chat-room'])) {
      if (query?.networkId || body?.networkId) {
        return query?.networkId || body?.networkId;
      }
    }

    const chatRoomId = await this.getRoomId(req);
    console.log('roomId', chatRoomId);
    if (!chatRoomId) {
      throw new Error('Room not found');
    }

    const room = await this.chatRoomService.findRoomById(chatRoomId);
    if (!room?.networkId) {
      throw new Error('Network not found');
    }
    console.log('room', room);
    return room.networkId;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const shouldIgnoreChatNetworkGuard = this.reflector.get<boolean>(
      'ignore-chat-network-guard',
      context.getHandler(),
    );
    if (shouldIgnoreChatNetworkGuard) {
      return true;
    }

    const networkId = await this.getNetworkId(req);
    if (!networkId) {
      throw new Error('Network not found');
    }

    const isNetworkUsedOnChat = await this.networkService.isNetworkUsedOnChat(
      networkId,
    );
    if (!isNetworkUsedOnChat) {
      throw new Error(
        'The current network is not supported. Please make sure you are using the correct network',
      );
    }

    return true;
  }
}
