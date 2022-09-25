import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KmsDataKeyModule } from 'src/kms-data-key/kms-data-key.module';
import { SharedModule } from 'src/shared/shared.module';

import { UserHdWalletRepository } from './repositories/user-hdwallet.repository';
import { UserHdWalletService } from './services/user-hdwallet.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([UserHdWalletRepository]),
    KmsDataKeyModule,
  ],
  exports: [UserHdWalletService],
  providers: [UserHdWalletService],
})
export class UserHdWalletModule {}
