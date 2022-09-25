import { Injectable } from '@nestjs/common';
import { DefaultToken } from 'src/default-token/entities/default-token.entity';
import { DefaultTokenRepository } from 'src/default-token/repositories/default-token.repository';

import { data } from '../data/default-token.data';

@Injectable()
export class DefaultTokenSeederService {
  constructor(private defaultTokenRepositiory: DefaultTokenRepository) {}

  create(): Promise<DefaultToken>[] {
    return data.map(async (token) => {
      return await this.defaultTokenRepositiory
        .findOne({
          where: {
            tokenName: token.tokenName,
          },
        })
        .then(async (tokenDb) => {
          if (tokenDb) {
            return tokenDb;
          }
          return await this.defaultTokenRepositiory.save(token);
        });
    });
  }
}
