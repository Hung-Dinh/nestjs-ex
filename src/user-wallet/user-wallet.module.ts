import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoomModule } from 'src/chat-room/chat-room.module';
import { DefaultTokenModule } from 'src/default-token/default-token.module';
import { JobModule } from 'src/jobs/job.module';
import { KmsDataKeyModule } from 'src/kms-data-key/kms-data-key.module';
import { MemberInRoomModule } from 'src/member-in-room/member-in-room.module';
import { NetworkModule } from 'src/network/network.module';
import { SharedModule } from 'src/shared/shared.module';
import { UserSettingModule } from 'src/user-setting/user-setting.module';
import { UserTokenModule } from 'src/user-token/user-token.module';

import { JwtAuthStrategy } from '../auth/strategies/jwt-auth.strategy';
import { UserWallletController } from './controllers/user-wallet.controller';
import { UserWalletRepository } from './repositories/user-wallet.repository';
import { UserWalletService } from './services/user-wallet.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([UserWalletRepository]),
    UserTokenModule,
    NetworkModule,
    DefaultTokenModule,
    JobModule,
    forwardRef(() => ChatRoomModule),
    forwardRef(() => UserSettingModule),
    forwardRef(() => MemberInRoomModule),
    KmsDataKeyModule,
  ],
  providers: [UserWalletService, JwtAuthStrategy],
  controllers: [UserWallletController],
  exports: [UserWalletService],
})
export class UserWalletModule {}
