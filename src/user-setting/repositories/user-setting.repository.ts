import { NotFoundException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import { UserSetting } from '../entities/user-setting.entity';

@EntityRepository(UserSetting)
export class UserSettingRepository extends Repository<UserSetting> {
    async getById(id: number): Promise<UserSetting> {
        const userSetting = await this.findOne(id);
        if (!userSetting) {
          // console.log('id ________NF', id);
          throw new NotFoundException();
        }
        return userSetting;
      }
}
