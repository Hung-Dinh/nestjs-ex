import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { plainToClass } from 'class-transformer';
import { FileService } from 'src/file/services/file.service';
import { MEMBER_IN_ROOM_STATUS } from 'src/shared/constants';
import { FindManyOptions, getConnection, getManager, In } from 'typeorm';

import { AppLogger } from '../../shared/logger/logger.service';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { UserContactOutput } from '../dtos/user-contact-output.dto';
import { CreateUserInput } from '../dtos/user-create-input.dto';
import { UserOutput } from '../dtos/user-output.dto';
import { UpdateUserInput } from '../dtos/user-update-input.dto';
import { UpdateUserProfileInput } from '../dtos/user-update-profile-input.dto';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService {
  constructor(
    private repository: UserRepository,
    private readonly logger: AppLogger,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
  ) {
    this.logger.setContext(UserService.name);
    this.repository = getConnection().getCustomRepository(UserRepository);
  }

  async findList(options: FindManyOptions): Promise<Partial<User>[]> {
    return this.repository.find(options);
  }

  async findUserByUserId(userId: number): Promise<User> {
    return this.repository.findOne(userId);
  }

  async createUser(
    ctx: RequestContext,
    input: CreateUserInput,
  ): Promise<UserOutput> {
    this.logger.log(ctx, `${this.createUser.name} was called`);

    const user = plainToClass(User, input);

    user.password = await hash(input.password, 10);
    this.logger.log(ctx, `calling ${UserRepository.name}.saveUser`);
    await this.repository.save(user);

    return plainToClass(UserOutput, user, {
      excludeExtraneousValues: true,
    });
  }

  async validateUsernamePassword(
    ctx: RequestContext,
    username: string,
    pass: string,
  ): Promise<UserOutput> {
    this.logger.log(ctx, `${this.validateUsernamePassword.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.findOne`);
    const user = await this.repository.findOne({ username });
    if (!user) throw new Error('Invalid username.');

    const match = await compare(pass, user.password);
    if (!match) throw new Error('Invalid password.');

    return plainToClass(UserOutput, user, {
      excludeExtraneousValues: true,
    });
  }

  async getUsers(
    ctx: RequestContext,
    limit: number,
    offset: number,
  ): Promise<{ users: UserOutput[]; count: number }> {
    this.logger.log(ctx, `${this.getUsers.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.findAndCount`);
    const [users, count] = await this.repository.findAndCount({
      where: {},
      take: limit,
      skip: offset,
    });

    const usersOutput = plainToClass(UserOutput, users, {
      excludeExtraneousValues: true,
    });

    return { users: usersOutput, count };
  }

  async findById(ctx: RequestContext, id: number): Promise<UserOutput> {
    this.logger.log(ctx, `${this.findById.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.findOne`);
    const user = await this.repository.findOne(id);

    return plainToClass(UserOutput, user, {
      excludeExtraneousValues: true,
    });
  }

  async getUserById(ctx: RequestContext, id: number): Promise<UserOutput> {
    this.logger.log(ctx, `${this.getUserById.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.getById`);
    const user = await this.repository.getById(id);
    let avatar = '';
    if (user?.avatar) {
      avatar = await this.fileService.getFileUrl(+user.avatar);
    }

    return plainToClass(
      UserOutput,
      { ...user, avatar },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async findByUsername(
    ctx: RequestContext,
    username: string,
  ): Promise<UserOutput> {
    this.logger.log(ctx, `${this.findByUsername.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.findOne`);
    const user = await this.repository.findOne({ username });

    let avatar = '';
    if (user?.avatar) {
      avatar = await this.fileService.getFileUrl(+user.avatar);
    }

    return plainToClass(
      UserOutput,
      { ...user, avatar },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async updateUsername(
    userId: number,
    newUsername: string,
  ): Promise<UserOutput> {
    const user = await this.repository.getById(userId);
    user.username = newUsername;
    await this.repository.save(user);

    let avatar = '';
    if (user?.avatar) {
      avatar = await this.fileService.getFileUrl(+user.avatar);
    }

    return plainToClass(
      UserOutput,
      { ...user, avatar },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async updateUser(
    ctx: RequestContext,
    userId: number,
    input: UpdateUserInput,
  ): Promise<UserOutput> {
    this.logger.log(ctx, `${this.updateUser.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.getById`);
    const user = await this.repository.getById(userId);

    // Hash the password if it exists in the input payload.
    if (input.password) {
      input.password = await hash(input.password, 10);
    }

    // update isAccountDisabled status if it exists in the input payload.
    if ('disableAccount' in input) {
      user.isAccountDisabled = input.disableAccount;
    }

    // merges the input (2nd line) to the found user (1st line)
    const updatedUser: User = {
      ...user,
      ...plainToClass(User, input),
    };

    this.logger.log(ctx, `calling ${UserRepository.name}.save`);
    const newUser = await this.repository.save(updatedUser);
    let avatar = '';
    if (newUser?.avatar) {
      avatar = await this.fileService.getFileUrl(+newUser.avatar);
    }

    return plainToClass(
      UserOutput,
      { ...newUser, avatar },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async getUsersWhereIdInIds(userIds: number[]): Promise<User[]> {
    return this.repository.find({
      where: {
        id: In(userIds),
      },
    });
  }

  async doesUsernameExist(username: string): Promise<boolean> {
    const user = await this.repository.findOne({ username });
    return !!user;
  }

  async updateProfile(
    ctx: RequestContext,
    userId: number,
    input: UpdateUserProfileInput,
  ): Promise<UserOutput> {
    this.logger.log(ctx, `${this.updateProfile.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.getById`);
    const user = await this.repository.getById(userId);

    // merges the input (2nd line) to the found user (1st line)
    const updatedUser: User = {
      ...user,
      ...plainToClass(User, input),
    };

    this.logger.log(ctx, `calling ${UserRepository.name}.update`);
    await this.repository.update(updatedUser.id, updatedUser);

    let avatar = '';

    if (input?.avatar) {
      avatar = await this.fileService.getFileUrl(+input.avatar);
    } else if (user?.avatar) {
      avatar = await this.fileService.getFileUrl(+user.avatar);
    }

    return plainToClass(
      UserOutput,
      { ...updatedUser, avatar },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async getBlockedUsersWalletAddresses(userId: number): Promise<string[]> {
    const entityManager = getManager();
    const blockedUsers = await entityManager.query(`
      select user_wallet.address from user_block
      left join user_wallet on user_wallet.userId = user_block.blockedUserId
      where user_block.userId = ${userId}
      and user_block.status = 1
    `);
    return blockedUsers.map((user) => {
      return user.address.toLowerCase();
    });
  }

  async getUsersAndContacts(
    ctx: RequestContext,
    userId: number,
    nameOrAddress: string,
    notInChatRoomId: number,
    isSendToken: number,
    limit: number,
    offset: number,
  ): Promise<UserContactOutput[]> {
    this.logger.log(ctx, `${this.getUsersAndContacts.name} was called`);

    let sql = ``;
    // nameOrAddress.length < 3, search in contact only
    if(isSendToken){
      sql = ` select distinct uc.id as userContactId , ifnull(uc.name, u.name) as name, uc.address, 
      ifnull(uc.avatar, u.avatar) as avatar
      from user_contact uc
      left join user_wallet uw on lower(uw.address)  = lower(uc.address)
      left join users u on u.id = uw.userId 
      where uc.userId = ${userId}`;
    } else {
      sql = ` select distinct uc.id as userContactId , ifnull(uc.name, u.name) as name, uc.address, 
      ifnull(uc.avatar, u.avatar) as avatar
      from user_contact uc
      left join user_wallet uw on lower(uw.address) = lower(uc.address)
      left join users u on u.id = uw.userId
      left join user_block ub on ub.userId = ${userId} and lower(ub.blockedWalletAddress) = lower(uc.address) and ub.status > 0
      left join user_setting us on us.userId = ${userId}
      left join user_wallet uw2 on uw2.id = us.useUserWalletId
      left join user_block ub2 on ub2.userId = uw.userId and lower(ub2.blockedWalletAddress) = lower(uw2.address) and ub2.status > 0
      where uc.userId = ${userId}
      and ub.id is null
      and ub2.id is null `   
    }     
    

    if (nameOrAddress)
      sql += ` and (lower(ifnull(uc.name, u.name)) like lower('%${nameOrAddress}%') 
                                      or lower(uc.address) like lower('%${nameOrAddress}%'))`;
    if (notInChatRoomId)
      sql += `  and lower(uc.address) not in (
          select lower(mir.walletAddress) 
          from member_in_room mir 
          where mir.chatRoomId = ${notInChatRoomId}
          and mir.status in ('${MEMBER_IN_ROOM_STATUS.JOINED}', '${MEMBER_IN_ROOM_STATUS.PENDING_APPROVAL}', '${MEMBER_IN_ROOM_STATUS.INVITED}')
          )`;
     
    sql += ` order by name asc
             limit ${limit}
             offset ${offset}`;

    // nameOrAddress.length >= 3, search in contacts and users
    if (nameOrAddress && nameOrAddress.length >= 3) {
      if(isSendToken){
        sql = `select distinct uc.id as userContactId, ifnull(uc.name, u.name) as name, ifnull(uc.address, uw.address) as address , 
        ifnull(uc.avatar, u.avatar) as avatar,
        if(uc.id is null, 1, 0) as isNotInContact
        from users u
        inner join user_wallet uw on uw.userId = u.id
        left join user_contact uc on uc.userId = ${userId} and lower(uc.address) = lower(uw.address) 
        where u.isAccountDisabled = 0 
        and u.id != ${userId}
        and (lower(ifnull(uc.name, u.name)) like lower('%${nameOrAddress}%') 
              or lower(ifnull(uc.address, uw.address)) like lower('%${nameOrAddress}%'))`; 
      } else {
        sql = `select distinct uc.id as userContactId, ifnull(uc.name, u.name) as name, ifnull(uc.address, uw.address) as address , 
        ifnull(uc.avatar, u.avatar) as avatar,
        if(uc.id is null, 1, 0) as isNotInContact
        from users u
        inner join user_wallet uw on uw.userId = u.id
        left join user_contact uc on uc.userId =${userId} and lower(uc.address) = lower(uw.address)
        left join user_block ub on ub.userId = ${userId} and lower(ub.blockedWalletAddress) = lower(uw.address) and ub.status > 0
        left join user_setting us on us.userId = ${userId}
        left join user_wallet uw2 on uw2.id = us.useUserWalletId
        left join user_block ub2 on ub2.userId = uw.userId and lower(ub2.blockedWalletAddress) = lower(uw2.address) and ub2.status > 0 
        where u.isAccountDisabled = 0 
        and u.id != ${userId}
        and ub.id is null
        and ub2.id is null
        and (lower(ifnull(uc.name, u.name)) like lower('%${nameOrAddress}%') 
              or lower(uw.address) like lower('%${nameOrAddress}%'))`; 

      }
     

      if (notInChatRoomId)
        sql += `  and lower(uw.address) not in (
              select lower(mir.walletAddress) 
              from member_in_room mir 
              where mir.chatRoomId = ${notInChatRoomId}
              and mir.status in ('${MEMBER_IN_ROOM_STATUS.JOINED}', '${MEMBER_IN_ROOM_STATUS.PENDING_APPROVAL}', '${MEMBER_IN_ROOM_STATUS.INVITED}')
              )`;

      sql += `  order by isNotInContact asc, name asc
      limit ${limit}
      offset ${offset}`;
    }
    // console.log('sql_____________:', sql);
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const resultSearch = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const resultSearch = await entityManager.query(sql);

    if (!resultSearch || !resultSearch.length) {
      return [];
    }

    // const blockedUserWalletAddresses =
    //   await this.getBlockedUsersWalletAddresses(ctx.user.id);
    // resultSearch = resultSearch?.filter((result) => {
    //   if (result?.address) {
    //     return !blockedUserWalletAddresses.includes(
    //       result.address.toLowerCase(),
    //     );
    //   }
    //   return true;
    // });

    const searchResultAvatarIds = resultSearch
      .map((contact: any) => {
        return contact.avatar;
      })
      .filter(Boolean);

    const avatarUrls = await this.fileService.getFileUrls(
      searchResultAvatarIds,
    );

    const contactOutputs = resultSearch.map((contact: any) => {
      if (contact?.avatar && avatarUrls[contact.avatar]) {
        contact.avatar = avatarUrls[contact.avatar];
      } else {
        contact.avatar = '';
      }

      return contact;
    });

    return plainToClass(UserContactOutput, <any[]>contactOutputs, {
      excludeExtraneousValues: true,
    });
  }
}
