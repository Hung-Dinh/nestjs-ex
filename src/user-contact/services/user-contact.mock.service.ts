import { Injectable, UnauthorizedException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import * as faker from 'faker';
import { Action } from 'src/shared/acl/action.constant';
import { Actor } from 'src/shared/acl/actor.constant';
import { MOCK_ADDRESS_LENGTH } from 'src/shared/constants';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { AddUserContactInput } from '../dtos/user-add-contact-input.dto';
import { UserContactOutput } from '../dtos/user-contact-output.dto';
import { UserContact } from '../entities/user-contact.entity';
import { UserContactAclService } from './user-contact-acl.service';

@Injectable()
export class MockUserContactService {
  userContactList: UserContact[] = [];
  numberOfMockRecords = 10;

  constructor(
    private readonly logger: AppLogger,
    private readonly aclService: UserContactAclService,
  ) {
    this.logger.setContext(MockUserContactService.name);
    this.userContactList = this.generateUserContactListData();
  }

  generateUserContactListData(): UserContact[] {
    // generate user token data using faker
    const userContactList = [];
    for (let i = 0; i < this.numberOfMockRecords; i++) {
      userContactList.push(
        plainToClass(UserContact, {
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

    return userContactList;
  }

  async findTokenByUserId(userId: number): Promise<UserContact[]> {
    return this.userContactList.filter(
      (userContact) => userContact.userId === userId,
    );
  }

  async findTokenById(tokenId: number): Promise<UserContact> {
    return new Promise((resolve) => {
      const userContact = this.userContactList.find(
        (token) => token.id === tokenId,
      );
      resolve(userContact);
    });
  }

  async removeTokenFromListById(tokenId: number): Promise<void> {
    return new Promise((resolve) => {
      this.userContactList = this.userContactList.filter(
        (userContact) => userContact.id !== tokenId,
      );
      resolve();
    });
  }

  async getUserContactList(
    ctx: RequestContext,
    userId: number,
    offset: number,
    limit: number,
  ): Promise<{
    tokens: UserContactOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.getUserContactList.name} was called`);
    const userContactList = await this.findTokenByUserId(userId);

    const count = userContactList.length;
    const slicedUserContactList = userContactList.slice(
      offset,
      Math.min(offset + limit, userContactList.length),
    );

    return {
      tokens: plainToClass(UserContactOutput, slicedUserContactList, {
        excludeExtraneousValues: true,
      }),
      count,
    };
  }

  async addToken(
    ctx: RequestContext,
    newToken: AddUserContactInput,
  ): Promise<UserContactOutput> {
    this.logger.log(ctx, `${this.addToken.name} was called`);

    const userContact = plainToClass(UserContact, {
      ...newToken,
      id: this.userContactList.length + 1,
      userId: ctx.user.id,
      logo: faker.image.business(),
      idEnabled: faker.datatype.boolean(),
      tokenDecimal: faker.datatype.number(18),
      tokenName: faker.random.word(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.userContactList.push(userContact);
    return plainToClass(UserContactOutput, userContact, {
      excludeExtraneousValues: true,
    });
  }

  async removeTokenById(ctx: RequestContext, tokenId: number): Promise<void> {
    this.logger.log(ctx, `${this.removeTokenById.name} was called`);

    const userContact = await this.findTokenById(tokenId);
    const actor: Actor = ctx.user;
    const isAllowed = this.aclService
      .forActor(actor)
      .canDoAction(Action.Delete, userContact);

    if (!isAllowed) {
      throw new Error('Unauthorized');
    }

    this.logger.log(ctx, `calling remove`);
    await this.removeTokenFromListById(tokenId);
  }
}
