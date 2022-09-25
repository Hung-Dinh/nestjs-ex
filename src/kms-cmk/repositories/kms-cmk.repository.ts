import { EntityRepository, Repository } from 'typeorm';

import { KmsCmk } from '../entities/kms-cmk.entity';

@EntityRepository(KmsCmk)
export class KmsCmkRepository extends Repository<KmsCmk> {}
