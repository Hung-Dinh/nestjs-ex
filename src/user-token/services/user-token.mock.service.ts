import { Injectable, UnauthorizedException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import * as faker from 'faker';
import { Action } from 'src/shared/acl/action.constant';
import { Actor } from 'src/shared/acl/actor.constant';
import { MOCK_ADDRESS_LENGTH } from 'src/shared/constants';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { AddUserTokenInput } from '../dtos/user-add-token-input.dto';
import { UserTokenOutput } from '../dtos/user-token-output.dto';
import { UserToken } from '../entities/user-token.entity';
import { UserTokenAclService } from './user-token-acl.service';

@Injectable()
export class MockUserTokenService {
  userTokenList: UserToken[] = [];
  numberOfMockRecords = 10;

  constructor(
    private readonly logger: AppLogger,
    private readonly aclService: UserTokenAclService,
  ) {
    this.logger.setContext(MockUserTokenService.name);
    this.userTokenList = this.generateUserTokenListData();
  }

  generateUserTokenListData(): UserToken[] {
    // generate user token data using faker
    const userTokenList = [];
    for (let i = 0; i < this.numberOfMockRecords; i++) {
      userTokenList.push(
        plainToClass(UserToken, {
          id: i,
          userId: i,
          tokenName: faker.random.word(),
          tokenSymbol: faker.random.word(),
          tokenAddress: faker.random.alphaNumeric(MOCK_ADDRESS_LENGTH),
          tokenDecimal: faker.datatype.number(18),
          idEnabled: faker.datatype.boolean(),
          logo: faker.image.business(),
          createdAt: faker.date.past(),
          updatedAt: faker.date.past(),
        }),
      );
    }

    return userTokenList;
  }

  async findTokenByUserId(userId: number): Promise<UserToken[]> {
    return this.userTokenList.filter(
      (userToken) => userToken.userId === userId,
    );
  }

  async findTokenById(tokenId: number): Promise<UserToken> {
    return new Promise((resolve) => {
      const userToken = this.userTokenList.find(
        (token) => token.id === tokenId,
      );
      resolve(userToken);
    });
  }

  async removeTokenFromListById(tokenId: number): Promise<void> {
    return new Promise((resolve) => {
      this.userTokenList = this.userTokenList.filter(
        (userToken) => userToken.id !== tokenId,
      );
      resolve();
    });
  }

  async getUserTokenList(
    ctx: RequestContext,
    userId: number,
    offset: number,
    limit: number,
  ): Promise<{
    tokens: UserTokenOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.getUserTokenList.name} was called`);
    const userTokenList = await this.findTokenByUserId(userId);

    const count = userTokenList.length;
    const slicedUserTokenList = userTokenList.slice(
      offset,
      Math.min(offset + limit, userTokenList.length),
    );

    return {
      tokens: plainToClass(UserTokenOutput, slicedUserTokenList, {
        excludeExtraneousValues: true,
      }),
      count,
    };
  }

  async addToken(
    ctx: RequestContext,
    newToken: AddUserTokenInput,
  ): Promise<UserTokenOutput> {
    this.logger.log(ctx, `${this.addToken.name} was called`);

    const userToken = plainToClass(UserToken, {
      ...newToken,
      id: this.userTokenList.length + 1,
      userId: ctx.user.id,
      logo: faker.image.business(),
      idEnabled: faker.datatype.boolean(),
      tokenDecimal: faker.datatype.number(18),
      tokenName: faker.random.word(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.userTokenList.push(userToken);
    return plainToClass(UserTokenOutput, userToken, {
      excludeExtraneousValues: true,
    });
  }

  async removeTokenById(ctx: RequestContext, tokenId: number): Promise<void> {
    this.logger.log(ctx, `${this.removeTokenById.name} was called`);

    const userToken = await this.findTokenById(tokenId);
    const actor: Actor = ctx.user;
    const isAllowed = this.aclService
      .forActor(actor)
      .canDoAction(Action.Delete, userToken);

    if (!isAllowed) {
      throw new Error('Unauthorized');
    }

    this.logger.log(ctx, `calling remove`);
    await this.removeTokenFromListById(tokenId);
  }
}
