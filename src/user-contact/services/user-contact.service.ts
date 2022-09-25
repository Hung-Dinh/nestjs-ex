import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { FileService } from 'src/file/services/file.service';
import { Actor } from 'src/shared/acl/actor.constant';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { NumberTool } from 'src/shared/tools/number.tool';
import { UserWalletService } from 'src/user-wallet/services/user-wallet.service';
import { FindManyOptions, getManager, In } from 'typeorm';

import { Action } from '../../shared/acl/action.constant';
import { BlockchainService } from '../../shared/blockchain-service/blockchain-service.service';
import { GetUserContactDetail } from '../dtos/get-user-contact-detail-input.dto';
import { GetUserContactListInput } from '../dtos/get-user-contact-list-input.dto';
import { AddUserContactInput } from '../dtos/user-add-contact-input.dto';
import { UserContactOutput } from '../dtos/user-contact-output.dto';
import { UpdateUserContactInput } from '../dtos/user-update-contact-input.dto';
import { UserContact } from '../entities/user-contact.entity';
import { UserContactRepository } from '../repositories/user-contact.repository';
import { UserContactAclService } from './user-contact-acl.service';

@Injectable()
export class UserContactService {
  constructor(
    private readonly logger: AppLogger,
    private repository: UserContactRepository,
    private blockchainService: BlockchainService,
    private readonly aclService: UserContactAclService,
    @Inject(forwardRef(() => UserWalletService))
    private readonly userWalletService: UserWalletService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
  ) {
    this.logger.setContext(UserContactService.name);
  }

  async findList(options: FindManyOptions): Promise<Partial<UserContact>[]> {
    return this.repository.find(options);
  }

  // async getUserContactList(
  //   ctx: RequestContext,
  //   userId: number,
  // ): Promise<UserContactOutput[]> {
  //   this.logger.log(ctx, `${this.getUserContactList.name} was called`);
  //   const userContactList = await this.repository.getContactsByUserId(userId);
  //   return userContactList.map((userContact) =>
  //     plainToClass(UserContactOutput, userContact, {
  //       excludeExtraneousValues: true,
  //     }),
  //   );
  // }

  async findById(contactId: number): Promise<UserContact> {
    return this.repository.getById(contactId);
  }

  async findByAddress(userId: number, address: string): Promise<UserContact> {
    return this.repository.findOne({
      where: {
        address: address.toLowerCase(),
        userId,
      },
    });
  }

  async findUserContactByAddress(
    userId: number,
    address: string,
  ): Promise<UserContact> {
    return this.repository.findOne({
      where: {
        userId,
        address,
      },
    });
  }

  async findUserContactsByAddressList(
    userId: number,
    addresses: string[],
  ): Promise<UserContact[]> {
    return this.repository.find({
      where: {
        userId,
        address: In(addresses),
      },
    });
  }

  async appendAvatarUrl(userContact: any): Promise<void> {
    if (userContact?.avatar && NumberTool.isStringNumber(userContact.avatar)) {
      const avatarUrl = await this.fileService.getFileUrl(userContact.avatar);
      userContact.avatar = avatarUrl;
    } else {
      userContact.avatar = '';
    }
  }

  async appendAvatarUrls(userContactsInput: any[]): Promise<any[]> {
    const slicedUserContactListAvatarIds = userContactsInput
      ?.map((contact: any) => {
        return contact.avatar;
      })
      ?.filter(Boolean);

    const avatarUrls = await this.fileService.getFileUrls(
      slicedUserContactListAvatarIds,
    );
    const contactsOuput: any[] = userContactsInput.map((userContact) => {
      if (userContact?.avatar && avatarUrls[userContact.avatar]) {
        userContact.avatar = avatarUrls[userContact.avatar];
      } else {
        userContact.avatar = '';
      }

      return userContact;
    });

    return contactsOuput;
  }

  async getBlockedUserWalletAddressOrUserId(
    userId: number,
    walletAddress: string,
  ): Promise<{
    blockedUserWalletAddress: string[];
    userIdsBlockedCurrentUser: number[];
  }> {
    const entityManager = getManager();
    const response = await entityManager.query(`
      select user_block.blockedWalletAddress as address, user_block.userId as userId 
      from user_block
      where (user_block.userId = ${userId} or user_block.blockedWalletAddress = "${walletAddress}")
      and user_block.status = 1
    `);

    let blockedUserWalletAddress =
      response?.map((e) => e?.address?.toLowerCase()).filter(Boolean) || [];
    blockedUserWalletAddress = [...new Set(blockedUserWalletAddress)];
    let userIdsBlockedCurrentUser =
      response?.map((e) => e.userId).filter(Boolean) || [];
    userIdsBlockedCurrentUser = userIdsBlockedCurrentUser = [
      ...new Set(userIdsBlockedCurrentUser),
    ];

    return {
      blockedUserWalletAddress,
      userIdsBlockedCurrentUser,
    };
  }

  private async omitBlockedUser({
    userId,
    requestAddress,
    userContactList,
  }: {
    userId: number;
    requestAddress: string;
    userContactList: any[];
  }) {
    let output = [...userContactList];
    const { blockedUserWalletAddress, userIdsBlockedCurrentUser } =
      await this.getBlockedUserWalletAddressOrUserId(userId, requestAddress);

    output = output
      .filter(
        (e) =>
          e?.address &&
          !blockedUserWalletAddress.includes(e.address.toLowerCase()),
      )
      .filter(
        (e) =>
          e?.walletUserId &&
          !userIdsBlockedCurrentUser.includes(e.walletUserId),
      );

    return output || [];
  }

  private getUserContactQuery({
    userId,
    conditions,
    limit,
    offset,
  }: {
    userId: number;
    conditions: any;
    offset?: number;
    limit?: number;
  }): string {
    return `select distinct uc.id, uc.userId, ifnull(uc.name, u.name) as name, uc.address, uw.userId as walletUserId,
    ifnull(uc.avatar, u.avatar) as avatar, uc.createdAt, uc.updatedAt 
    from user_contact uc
    left join user_wallet uw on lower(uw.address)=lower(uc.address)
    left join users u on u.id = uw.userId
    left join user_block ub on ub.userId = ${userId} and lower(ub.blockedWalletAddress) = lower(uc.address) and ub.status > 0
    left join user_setting us on us.userId = ${userId}
    left join user_wallet uw2 on uw2.id = us.useUserWalletId
    left join user_block ub2 on ub2.userId = uw.userId and lower(ub2.blockedWalletAddress) = lower(uw2.address) and ub2.status > 0
    where ub.id is null
    and ub2.id is null 
    and ${conditions?.join(' and ')}
    order by name asc
    ${!isNaN(limit) ? `limit ${limit}` : ''}
    ${!isNaN(offset) ? `offset ${offset}` : ''}`;
  }

  async getUserContactList(
    ctx: RequestContext,
    input: GetUserContactListInput,
  ): Promise<{
    contacts: UserContactOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.getUserContactList.name} was called`);
    const userId = ctx.user.id;
    const { limit, offset, requestAddress } = input;

    const entityManager = getManager();
    const GET_CONTACT_LIST_QUERY = this.getUserContactQuery({
      userId,
      limit,
      offset,
      conditions: [`uc.userId = ${userId}`],
    });
    // console.log('sql_____________:', sql);
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const userContactList = await slaveQueryRunner.query(sql);
    const userContactList = await entityManager.query(GET_CONTACT_LIST_QUERY);

    if (!userContactList || !userContactList.length) {
      return {
        contacts: [],
        count: 0,
      };
    }

    // userContactList = await this.omitBlockedUser({
    //   userId,
    //   requestAddress,
    //   userContactList,
    // });

    const count = userContactList.length;
    const contactsOuput: any[] = await this.appendAvatarUrls(userContactList);
    return {
      contacts: plainToClass(UserContactOutput, contactsOuput, {
        excludeExtraneousValues: true,
      }),
      count,
    };
  }

  async searchUserContact(
    ctx: RequestContext,
    input: GetUserContactListInput,
  ): Promise<{
    contacts: UserContactOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.searchUserContact.name} was called`);
    const userId = ctx.user.id;
    const { limit, nameOrAddress, offset, requestAddress } = input;

    const SEARCH_USER_QUERY = this.getUserContactQuery({
      userId,
      conditions: [
        `uc.userId = ${userId}`,
        `(lower(ifnull(uc.name, u.name)) like lower('%${nameOrAddress}%') 
                                      or lower(uc.address) like lower('%${nameOrAddress}%'))`,
      ],
      limit,
      offset,
    });

    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const resultSearchContacts = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const resultSearchContacts = await entityManager.query(SEARCH_USER_QUERY);

    if (!resultSearchContacts || !resultSearchContacts.length) {
      return {
        contacts: [],
        count: 0,
      };
    }

    // resultSearchContacts = await this.omitBlockedUser({
    //   userId,
    //   requestAddress,
    //   userContactList: resultSearchContacts,
    // });
    const contactsOuput: any[] = await this.appendAvatarUrls(
      resultSearchContacts,
    );

    /**
     * TODO: This value is useless, but we will leave it here for now. Might be updated later
     */
    const count = resultSearchContacts.length;
    return {
      contacts: plainToClass(UserContactOutput, contactsOuput, {
        excludeExtraneousValues: true,
      }),
      count,
    };
  }

  private async isBlocking({
    userId,
    requestAddress,
    address,
  }: {
    userId: number;
    requestAddress: string;
    address: string;
  }) {
    const userWallet = await this.userWalletService.findUserWalletByAddress(
      address,
    );
    if (userWallet) {
      const otherUserId = userWallet?.userId;
      const GET_USER_BLOCK_QUERY = `
        select id from user_block
        where (userId=${userId} and blockedWalletAddress="${address}"
        or userId=${otherUserId} and blockedWalletAddress="${requestAddress}")
        and status=1
      `;
      const response = await getManager().query(GET_USER_BLOCK_QUERY);
      return response?.length > 0;
    }
    return false;
  }

  async addContact(
    ctx: RequestContext,
    input: AddUserContactInput,
  ): Promise<UserContactOutput> {
    this.logger.log(ctx, `${this.addContact.name} was called`);
    const { address, avatar, name, requestAddress } = input;
    const userId = ctx.user.id;
    const isAddress = await this.blockchainService.isValidAddress(
      input.address,
    );
    if (!isAddress) {
      throw new Error('This address is not valid!');
    }

    const areUsersBlockingEachOther = await this.isBlocking({
      userId,
      requestAddress,
      address,
    });
    if (areUsersBlockingEachOther) {
      throw new Error('This user blocked you or you blocked this user');
    }

    const addedUser = await this.userWalletService.getUserFromAddress(
      ctx,
      input.address,
    );
    if (!addedUser) {
      throw new Error("Can't find the user that has this address!");
    }
    // input.name = input.name || addedUser.name;

    const userContactList = await this.repository.getContactsByUserId(
      ctx.user.id,
    );
    if (
      userContactList.find(
        (x) => x.address?.toLowerCase() == input.address?.toLowerCase(),
      )
    ) {
      throw new Error('This contact had been added!');
    }

    if (input?.requestAddress) {
      delete input.requestAddress;
    }
    const userContact = plainToClass(UserContact, {
      ...input,
      userId: ctx.user.id,
    });
    this.logger.log(ctx, `calling ${UserContactRepository.name}.save contact`);
    await this.repository.save(userContact);
    await this.appendAvatarUrl(userContact);
    return plainToClass(UserContactOutput, userContact, {
      excludeExtraneousValues: true,
    });
  }

  async updateUserContact(
    ctx: RequestContext,
    userId: number,
    input: UpdateUserContactInput,
  ): Promise<UserContactOutput> {
    this.logger.log(ctx, `${this.updateUserContact.name} was called`);
    const { address, avatar, id, name, requestAddress } = input;
    if (address) {
      const isAddress = await this.blockchainService.isValidAddress(address);
      if (!isAddress) {
        throw new Error('This address is not valid!');
      }
      const addedUser = await this.userWalletService.getUserFromAddress(
        ctx,
        address,
      );
      if (!addedUser) {
        throw new Error("Can't find the user that has this address!");
      }

      const areUsersBlockingEachOther = await this.isBlocking({
        userId,
        requestAddress,
        address,
      });
      if (areUsersBlockingEachOther) {
        throw new Error('This user blocked you or you blocked this user');
      }
    }

    const userContact = await this.repository.getContactsByUserIdAndId(
      userId,
      id,
    );
    if (!userContact) {
      throw new Error('This contact does not exist!');
    }

    if (input?.requestAddress) {
      delete input.requestAddress;
    }
    const newUpdatedContact: UserContact = {
      ...userContact,
      ...plainToClass(UserContact, input),
      updatedAt: new Date(),
    };
    // console.log('newUpdatedContact:_________ ',newUpdatedContact);

    this.logger.log(
      ctx,
      `calling ${UserContactRepository.name}.update contact`,
    );
    await this.repository.update(newUpdatedContact.id, newUpdatedContact);
    await this.appendAvatarUrl(newUpdatedContact);
    return plainToClass(UserContactOutput, newUpdatedContact, {
      excludeExtraneousValues: true,
    });
  }

  async getContactDetailById(
    ctx: RequestContext,
    input: GetUserContactDetail,
  ): Promise<UserContactOutput> {
    this.logger.log(ctx, `${this.getContactDetailById.name} was called`);

    const { id, requestAddress } = input;
    const userId = ctx.user.id;

    const GET_USER_CONTACT_DETAIL = this.getUserContactQuery({
      userId,
      conditions: [`uc.userId = ${ctx.user.id}`, `uc.id = ${id}`],
    });

    // console.log('sql_____________:', sql);
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const userContacts = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const userContacts = await entityManager.query(GET_USER_CONTACT_DETAIL);

    // if (!userContacts || !userContacts.length) {
    //   throw new Error('This contact does not exist!');
    // }

    // userContacts = await this.omitBlockedUser({
    //   userId,
    //   requestAddress,
    //   userContactList: userContacts,
    // });

    if (!userContacts || !userContacts.length) {
      throw new Error('This contact does not exist or has been blocked!');
    }

    await this.appendAvatarUrl(userContacts[0]);
    return plainToClass(UserContactOutput, userContacts[0], {
      excludeExtraneousValues: true,
    });
  }

  async removeContactById(
    ctx: RequestContext,
    contactId: number,
  ): Promise<void> {
    this.logger.log(ctx, `${this.removeContactById.name} was called`);
    this.logger.log(ctx, `calling ${UserContactRepository.name}.getById`);

    const userContact = await this.repository.getContactsByUserIdAndId(
      ctx.user.id,
      contactId,
    );
    if (!userContact) {
      throw new Error('This contact does not exist!');
    }

    const actor: Actor = ctx.user;
    const isAllowed = this.aclService
      .forActor(actor)
      .canDoAction(Action.Delete, userContact);

    if (!isAllowed) {
      throw new Error('Unauthorized');
    }

    this.logger.log(ctx, `calling ${UserContactRepository.name}.remove`);
    await this.repository.remove(userContact);
  }

  async getContactById(contactId: number): Promise<UserContactOutput> {
    const userContact = await this.repository.getById(contactId);
    if (!userContact) {
      throw new Error('This contact does not exist!');
    }
    return plainToClass(UserContactOutput, userContact, {
      excludeExtraneousValues: true,
    });
  }

  async addNewUserContact(contactItem: Record<string, any>) {
    const userContact = plainToClass(UserContact, contactItem);
    const newUserContact = await this.repository.save(userContact);
    return plainToClass(UserContactOutput, newUserContact, {
      excludeExtraneousValues: true,
    });
  }

  async findByAddress_Query(
    userId: number,
    address: string,
  ): Promise<Record<string, any>> {
    const sql = ` select uc.*
    from user_contact uc
    where uc.userId = ${userId}
    and lower(uc.address)= lower('${address}') `;

    // console.log('sql_____________:', sql);
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const userContacts = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const userContacts = await entityManager.query(sql);

    if (!userContacts || !userContacts.length) {
      return {};
    } else {
      return userContacts[0];
    }
  }

  async findByWalletAddress(address: string) {
    return this.repository.findOne({
      where: {
        address,
      },
    });
  }
}
