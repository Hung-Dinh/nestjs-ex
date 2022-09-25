import { Injectable } from '@nestjs/common';
import { Network } from 'src/network/entities/network.entity';
import { NetworkRepository } from 'src/network/repositories/network.repository';

import { data } from '../data/network.data';

@Injectable()
export class NetworkSeederService {
  constructor(private networkRepository: NetworkRepository) {}

  create(): Promise<Network>[] {
    return data.map(async (network) => {
      return await this.networkRepository
        .findOne({
          where: {
            chainId: network.chainId,
          },
        })
        .then(async (networkDb) => {
          if (networkDb) {
            return networkDb;
          }
          return await this.networkRepository.save(network);
        });
    });
  }
}
