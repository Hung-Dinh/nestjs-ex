import { NotFoundException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import { Message } from '../entities/message.entity';

@EntityRepository(Message)
export class MessageRepository extends Repository<Message> {
    async getMessageById(
        id: number
      ): Promise<Message> {
        const message = await this.findOne(id);
        if (!message) {
          throw new NotFoundException();
        }
        return message;
      }
}
