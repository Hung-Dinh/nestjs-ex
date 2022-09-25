import { EntityRepository, Repository } from 'typeorm';

import { KmsDataKey } from '../entities/kms-data-key.entity';

@EntityRepository(KmsDataKey)
export class KmsDataKeyRepository extends Repository<KmsDataKey> {}
