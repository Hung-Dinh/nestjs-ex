import { Injectable } from '@nestjs/common';

import { KmsCmk } from '../entities/kms-cmk.entity';
import { KmsCmkRepository } from '../repositories/kms-cmk.repository';

@Injectable()
export class KmsCmkService {
  constructor(private readonly kmsCmkRepository: KmsCmkRepository) {}

  async getCmkById(id: number): Promise<KmsCmk> {
    return this.kmsCmkRepository.findOne(id);
  }

  async getFirstCmk(): Promise<KmsCmk> {
    return this.kmsCmkRepository.findOne({
      idEnabled: true,
    });
  }
}
