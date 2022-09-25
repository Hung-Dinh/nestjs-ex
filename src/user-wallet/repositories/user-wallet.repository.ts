import { NotFoundException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import { UserWallet } from '../entities/user-wallet.entity';

@EntityRepository(UserWallet)
export class UserWalletRepository extends Repository<UserWallet> {
  async getByid(id: number): Promise<UserWallet> {
    const wallet = await this.findOne(id);
    if (!wallet) {
      throw new NotFoundException();
    }
    return wallet;
  }
}
