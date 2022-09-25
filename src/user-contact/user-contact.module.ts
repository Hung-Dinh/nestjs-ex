import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from 'src/file/file.module';
import { NetworkModule } from 'src/network/network.module';
import { UserWalletModule } from 'src/user-wallet/user-wallet.module';

import { JwtAuthStrategy } from '../auth/strategies/jwt-auth.strategy';
import { SharedModule } from '../shared/shared.module';
import { UserContactController } from './controllers/user-contact.controller';
import { UserContactRepository } from './repositories/user-contact.repository';
import { MockUserContactService } from './services/user-contact.mock.service';
import { UserContactService } from './services/user-contact.service';
import { UserContactAclService } from './services/user-contact-acl.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([UserContactRepository]),
    NetworkModule,
    forwardRef(() => UserWalletModule),
    forwardRef(() => FileModule),
  ],
  providers: [
    UserContactService,
    JwtAuthStrategy,
    UserContactAclService,
    MockUserContactService,
  ],
  controllers: [UserContactController],
  exports: [UserContactService, MockUserContactService],
})
export class UserContactModule {}
