import { NotFoundException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import { ChatRoom } from '../entities/chat-room.entity';

@EntityRepository(ChatRoom)
export class ChatRoomRepository extends Repository<ChatRoom> {
    async getById(id: number): Promise<ChatRoom> {
        const userToken = await this.findOne(id);
        if (!userToken) {
          throw new NotFoundException();
        }
        return userToken;
      }
}
