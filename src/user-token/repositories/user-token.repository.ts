import { NotFoundException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import { UserToken } from '../entities/user-token.entity';

@EntityRepository(UserToken)
export class UserTokenRepository extends Repository<UserToken> {
  async getTokensByUserId(userId: number): Promise<UserToken[]> {
    const userTokens = await this.find({ where: { userId } });
    if (!userTokens) {
      throw new NotFoundException();
    }
    return userTokens;
  }

  async getById(id: number): Promise<UserToken> {
    const userToken = await this.findOne(id);
    if (!userToken) {
      throw new NotFoundException();
    }
    return userToken;
  }

  async getTokensByUserIdAndNetworkId(
    userId: number,
    networkId: number,
  ): Promise<UserToken[]> {
    const userTokens = await this.find({ where: { userId, networkId } });

    // remove duplicate tokens by token address
    const seenAddresses = new Set();
    const uniqueTokens = userTokens.reduce((acc, curr) => {
      if (curr?.tokenAddress && !seenAddresses.has(curr.tokenAddress)) {
        acc.push(curr);
        seenAddresses.add(curr.tokenAddress);
      }
      return acc;
    }, []);

    if (!uniqueTokens) {
      throw new NotFoundException();
    }
    return uniqueTokens;
  }
}
