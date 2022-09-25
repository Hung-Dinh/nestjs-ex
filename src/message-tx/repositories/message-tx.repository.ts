import { EntityRepository, Repository } from 'typeorm';

import { MessageTx } from '../entities/message-tx.entity';

@EntityRepository(MessageTx)
export class MessageTxRepository extends Repository<MessageTx> {}
