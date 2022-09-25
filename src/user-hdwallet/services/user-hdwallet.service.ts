import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { KmsDataKeyService } from 'src/kms-data-key/services/kms-data-key.service';
import { KMS_ENABLED } from 'src/shared/configs/secret';
import { SEED_PHARSE_WORDS_COUNT } from 'src/shared/constants';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { CreateHdWalletInput } from '../dtos/creater-user-hdwallet-input.dto';
import { UserHdWalletOutput } from '../dtos/user-hdwallet-output.dto';
import { UserHdWallet } from '../entities/user-hdwallet.entity';
import { UserHdWalletRepository } from '../repositories/user-hdwallet.repository';

@Injectable()
export class UserHdWalletService {
  constructor(
    private logger: AppLogger,
    private readonly userHdWalletRepository: UserHdWalletRepository,
    private readonly kmsDataKeyService: KmsDataKeyService,
  ) {
    this.logger.setContext(UserHdWalletService.name);
  }

  validateUserSeedPhrase(seedPhrase: string): boolean {
    /**
     * TODO: need to investigate this later
     * Currently, only check if seedPhrase has 12 words
     */

    return seedPhrase.split(' ').length === SEED_PHARSE_WORDS_COUNT;
  }

  async createHdWallet(
    ctx: RequestContext,
    input: CreateHdWalletInput,
  ): Promise<UserHdWalletOutput> {
    this.logger.log(ctx, `${this.createHdWallet.name} was called`);

    let kmsDataKeyId = null;

    if (KMS_ENABLED) {
      const kmsDataKey = await this.kmsDataKeyService.generateOrGetDataKey();

      if (kmsDataKey && input.seedPhrase) {
        input.seedPhrase = await this.kmsDataKeyService.encrypt(
          input.seedPhrase,
          kmsDataKey.id,
        );
        kmsDataKeyId = kmsDataKey.id;
      }
    }

    const userHdWallet = plainToClass(UserHdWallet, {
      ...input,
      walletName: '',
      isHD: input.seedPhrase ? true : false,
      hdPath: input.hdWalletPath,
      isExternal: input.isExternal ? true : false,
      kmsDataKeyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.logger.log(ctx, `calling ${UserHdWalletRepository.name}.save`);
    await this.userHdWalletRepository.save(userHdWallet);

    return plainToClass(UserHdWalletOutput, userHdWallet, {
      excludeExtraneousValues: true,
    });
  }

  async findUserHdWalletBySeedPhrase(
    seedPhrase: string,
  ): Promise<UserHdWallet> {
    if (KMS_ENABLED) {
      const kmsDataKey = await this.kmsDataKeyService.generateOrGetDataKey();

      if (kmsDataKey) {
        const encryptedSeedPhrase = await this.kmsDataKeyService.encrypt(
          seedPhrase,
          kmsDataKey.id,
        );

        console.debug('encryptedSeedPhrase', encryptedSeedPhrase);

        const [responseWithEncrypted, responseWithNormal] = await Promise.all([
          this.userHdWalletRepository.findOne({
            where: {
              seedPhrase: encryptedSeedPhrase,
              kmsDataKeyId: kmsDataKey.id,
            },
          }),
          this.userHdWalletRepository.findOne({
            where: {
              seedPhrase,
            },
          }),
        ]);

        if (responseWithEncrypted) {
          return responseWithEncrypted;
        }

        return responseWithNormal;
      }
    }

    return this.userHdWalletRepository.findOne({ seedPhrase });
  }
}
