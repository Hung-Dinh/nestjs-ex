import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import * as faker from 'faker';
import { MOCK_ADDRESS_LENGTH } from 'src/shared/constants';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { DefaultToken } from '../entities/default-token.entity';

@Injectable()
export class MockDefaultTokenService {
  defaultTokenList: DefaultToken[];
  numberOfMockRecords = 10;

  constructor(private logger: AppLogger) {
    this.defaultTokenList = this.generateDefaultTokenList();
  }

  generateDefaultTokenList(): DefaultToken[] {
    // generate user token data using faker
    const defaultTokenList = [];

    for (let i = 0; i < this.numberOfMockRecords; i++) {
      defaultTokenList.push(
        plainToClass(DefaultToken, {
          id: i,
          tokenName: faker.random.word(),
          tokenSymbol: faker.random.word(),
          tokenAddress: faker.random.alphaNumeric(MOCK_ADDRESS_LENGTH),
          tokenDecimal: faker.datatype.number(),
          idEnabled: faker.datatype.boolean(),
          logo: faker.image.business(),
          createdAt: faker.date.past(),
          updatedAt: faker.date.past(),
        }),
      );
    }

    return defaultTokenList;
  }

  async getDefaultTokenList(
    ctx: RequestContext,
    limit: number,
    offset: number,
  ): Promise<{
    tokens: DefaultToken[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.getDefaultTokenList.name} was called`);
    const count = this.defaultTokenList.length;

    return new Promise((resolve) => {
      resolve({
        tokens: this.defaultTokenList.slice(
          offset,
          Math.min(offset + limit, this.defaultTokenList.length),
        ),
        count,
      });
    });
  }
}
