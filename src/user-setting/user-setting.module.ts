import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from 'src/file/file.module';
import { NetworkModule } from 'src/network/network.module';
import { SharedModule } from 'src/shared/shared.module';
import { UserWalletModule } from 'src/user-wallet/user-wallet.module';

import { UserSettingController } from './controllers/user-setting.controller';
import { UserSettingRepository } from './repositories/user-setting.repository';
import { UserSettingService } from './services/user-setting.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([UserSettingRepository]),
    NetworkModule,
    forwardRef(() => UserWalletModule),
    FileModule,
  ],
  providers: [UserSettingService],
  controllers: [UserSettingController],
  exports: [UserSettingService],
})
export class UserSettingModule {}
