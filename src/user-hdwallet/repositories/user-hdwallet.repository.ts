import { EntityRepository, Repository } from 'typeorm';

import { UserHdWallet } from '../entities/user-hdwallet.entity';

@EntityRepository(UserHdWallet)
export class UserHdWalletRepository extends Repository<UserHdWallet> {}
