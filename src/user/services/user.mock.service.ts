import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { plainToClass } from 'class-transformer';

import { AppLogger } from '../../shared/logger/logger.service';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { UserContactOutput } from '../dtos/user-contact-output.dto';
import { CreateUserInput } from '../dtos/user-create-input.dto';
import { UserOutput } from '../dtos/user-output.dto';
import { UpdateUserInput } from '../dtos/user-update-input.dto';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserMockService {
  constructor(
    private repository: UserRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserMockService.name);
  }
 
  async getUserContacts(
    ctx: RequestContext,
    userId: number,
    limit: number,
    offset: number
  ): Promise<UserContactOutput[]> {
    this.logger.log(ctx, `${this.getUserContacts.name} was called`);

    const listContact = [
      {
           "address": "0x0000000000000000000000000000000000000000",
           "name": "Yan Shire",
           "avatar": "",
       },
       {
           "address": "0x0000000000000000000000000000000000000000",
           "name": "Luck Shaw",
           "avatar": "",
       },
       {
           "address": "0x0000000000000000000000000000000000000000",
           "name": "Panda",
           "avatar": "",
       },
       {
        "address": "0x0000000000000000000000000000000000000000",
        "name": "Panda Jin",
        "avatar": "",
       },
       {
        "address": "0x0000000000000000000000000000000000000000",
        "name": "Panda Qui",
        "avatar": "",
       },
       {
        "address": "0x0000000000000000000000000000000000000000",
        "name": "Panda Frank",
        "avatar": "",
       }

    ]

    return plainToClass(UserContactOutput, listContact, {
      excludeExtraneousValues: true,
    });
  }

 
}
