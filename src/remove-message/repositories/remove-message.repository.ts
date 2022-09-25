import { NotFoundException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import { RemoveMessage } from '../entities/remove-message.entity';

@EntityRepository(RemoveMessage)
export class RemoveMessageRepository extends Repository<RemoveMessage> {
    async getById(id: number): Promise<RemoveMessage> {
        const removeMessage = await this.findOne(id);
        if (!removeMessage) {
          // console.log('id ________NF', id);
          throw new NotFoundException();
        }
        return removeMessage;
      }
}
