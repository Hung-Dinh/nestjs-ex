import { Injectable } from '@nestjs/common';

import { DefaultTokenSeederService } from './default-token-seeder.service';
import { NetworkSeederService } from './network-seeder.service';

@Injectable()
export class SeederService {
  constructor(
    private readonly networkSeederService: NetworkSeederService,
    private readonly defaultTokenSeederService: DefaultTokenSeederService,
  ) {}

  async seed(): Promise<boolean[]> {
    return Promise.all([
      this.seedCaller(this.networkSeederService),
      this.seedCaller(this.defaultTokenSeederService),
    ]);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async seedCaller(service: any): Promise<boolean> {
    return await Promise.all(service.create())
      .then((createdRecords) => {
        console.debug(
          {},
          'No. of record created : ' +
            createdRecords.filter(
              (nullValueOrCreatedLanguage) => nullValueOrCreatedLanguage,
            ).length,
        );
        return Promise.resolve(true);
      })
      .catch((error) => Promise.reject(error));
  }
}
