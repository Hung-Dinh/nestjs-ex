import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { FileService } from 'src/file/services/file.service';
import { NetworkService } from 'src/network/services/network.service';
import { GAS_FEE_LEVEL, REPLICATION_MODE } from 'src/shared/constants';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { NumberTool } from 'src/shared/tools/number.tool';
import { UserWalletService } from 'src/user-wallet/services/user-wallet.service';
import { getConnection, getManager } from 'typeorm';

import { AddUserSettingInput } from '../dtos/user-add-setting-input.dto';
import { UserDefaultSettingInput } from '../dtos/user-default-setting-input.dto';
import { UserSettingOutput } from '../dtos/user-setting-output.dto';
import { UserSetting } from '../entities/user-setting.entity';
import { UserSettingRepository } from '../repositories/user-setting.repository';

@Injectable()
export class UserSettingService {
  constructor(
    private readonly logger: AppLogger,
    private readonly networkService: NetworkService,
    private readonly repository: UserSettingRepository,
    @Inject(forwardRef(() => UserWalletService))
    private readonly userWalletService: UserWalletService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
  ) {
    this.logger.setContext(UserSettingService.name);
  }

  async findById(settingId: number): Promise<UserSetting> {
    return this.repository.getById(settingId);
  }

  async findOneByUserId(userId: number): Promise<UserSetting> {
    return this.repository.findOne({
      where: {
        userId,
      },
    });
  }

  async upsertSetting(
    ctx: RequestContext,
    userId: number,
    newSetting: AddUserSettingInput,
  ): Promise<UserSettingOutput> {
    this.logger.log(ctx, `${this.upsertSetting.name} was called`);

    const network = await this.networkService.findNetworkById(
      newSetting.useNetworkId,
    );
    if (!network) {
      throw new Error('Default network not found!');
    }

    const userWallet = await this.userWalletService.findByIdAndUserId(
      newSetting.useUserWalletId,
      userId,
    );

    if (!userWallet) {
      throw new Error('Default wallet not found!');
    }

    if (!GAS_FEE_LEVEL[newSetting.gasFeeLevel.toUpperCase()]) {
      throw new Error('Gas fee level is not valid!');
    }

    const existSetting = await this.findOneByUserId(userId);

    if (existSetting) {
      const userSetting = plainToClass(UserSetting, {
        ...existSetting,
        ...newSetting,
        updatedAt: new Date(),
      });
      this.logger.log(
        ctx,
        `calling ${UserSettingRepository.name}.update setting`,
      );
      await this.repository.update(existSetting.id, userSetting);
      return plainToClass(UserSettingOutput, userSetting, {
        excludeExtraneousValues: true,
      });
    } else {
      const userSetting = plainToClass(UserSetting, {
        ...newSetting,
        userId: userId,
      });
      this.logger.log(
        ctx,
        `calling ${UserSettingRepository.name}.save setting`,
      );
      await this.repository.save(userSetting);
      return plainToClass(UserSettingOutput, userSetting, {
        excludeExtraneousValues: true,
      });
    }
  }

  async getSettingDetail(
    ctx: RequestContext,
    userId: number,
  ): Promise<UserSettingOutput> {
    this.logger.log(ctx, `${this.getSettingDetail.name} was called`);
    const userSetting = await this.getUserInfoById(userId);
    if (!userSetting) {
      throw new Error('User not found!');
    }

    if (userSetting?.avatar && NumberTool.isStringNumber(userSetting.avatar)) {
      userSetting.avatar = await this.fileService.getFileUrl(
        +userSetting.avatar,
      );
    } else {
      userSetting.avatar = '';
    }

    return plainToClass(UserSettingOutput, userSetting, {
      excludeExtraneousValues: true,
    });
  }

  async getUserInfoById(userId: number) {
    const sql = `select 
      u.name as displayName, 
      u.avatar,
      us.*, 
      uw.address as defaultWalletAddress,
      n.rpcEndpoint as defaultRpcEndpoint,
      n.name as networkName,
      n.nativeTokenSymbol as defaultTokenSymbol 
      from users u
      left join user_setting us  on us.userId = u.id
      left join user_wallet uw on uw.id = us.useUserWalletId
      left join network n on n.id = us.useNetworkId 
      where u.id = ${userId}`;
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const user = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const user = await entityManager.query(sql);

    if (!user || user.length == 0) {
      return;
    } else {
      return user[0];
    }
  }

  async createDefaultSetting(input: UserDefaultSettingInput): Promise<void> {
    const { networkId, userId, userWalletId } = input;
    const existSetting = await this.findOneByUserId(userId);
    if (!existSetting) {
      const newUserSetting = plainToClass(UserSetting, {
        userId,
        useNetworkId: networkId,
        useUserWalletId: userWalletId,
        gasFeeLevel: GAS_FEE_LEVEL.MEDIUM,
        language: 'en',
        displayCurrency: 'USD',
        biometrics: false,
        isEnableAutosignMessage: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await this.repository.save(newUserSetting);
    }
  }
}
