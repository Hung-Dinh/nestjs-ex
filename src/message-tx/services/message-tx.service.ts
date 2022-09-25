import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

import { MessageTx } from '../entities/message-tx.entity';
import { MessageTxRepository } from '../repositories/message-tx.repository';

@Injectable()
export class MessageTxService {
  constructor(private readonly messageTxRepository: MessageTxRepository) {}

  async createMessageTx(messageId: number): Promise<MessageTx> {
    return this.messageTxRepository.save(
      plainToClass(MessageTx, {
        messageId,
        status: 'pending',
      }),
    );
  }
}
