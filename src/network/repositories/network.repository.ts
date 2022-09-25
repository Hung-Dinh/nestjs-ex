import { NotFoundException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import { Network } from '../entities/network.entity';

@EntityRepository(Network)
export class NetworkRepository extends Repository<Network> {
  async getById(id: number): Promise<Network> {
    const network = await this.findOne(id);
    if (!network) {
      throw new NotFoundException(`Network with id ${id} not found`);
    }
    return network;
  }
}
