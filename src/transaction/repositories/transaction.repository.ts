import { NotFoundException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import { Transaction } from '../entities/transaction.entity';

@EntityRepository(Transaction)
export class TransactionRepository extends Repository<Transaction> {
  async getTokensByUserId(userId: number): Promise<Transaction[]> {
    const transactions = await this.find({ where: { userId } });
    if (!transactions) {
      throw new NotFoundException();
    }
    return transactions;
  }

  async getById(id: number): Promise<Transaction> {
    const transaction = await this.findOne(id);
    if (!transaction) {
      throw new NotFoundException();
    }
    return transaction;
  }
}
