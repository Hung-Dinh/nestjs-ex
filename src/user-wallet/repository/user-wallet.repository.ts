import { EntityRepository, Repository } from 'typeorm';

import { UserWallet } from '../entities/user-wallet.entity';

@EntityRepository(UserWallet)
export class UserWalletRepository extends Repository<UserWallet> {}
