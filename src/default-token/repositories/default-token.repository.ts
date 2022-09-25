import { EntityRepository, Repository } from 'typeorm';

import { DefaultToken } from '../entities/default-token.entity';

@EntityRepository(DefaultToken)
export class DefaultTokenRepository extends Repository<DefaultToken> {}
