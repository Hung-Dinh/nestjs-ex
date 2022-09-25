import { EntityRepository, Repository } from 'typeorm';

import { UserBlock } from '../entities/user-block.entity';

@EntityRepository(UserBlock)
export class UserBlockRepository extends Repository<UserBlock> {}
