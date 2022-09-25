import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DefaultTokenModule } from 'src/default-token/default-token.module';
import { NetworkModule } from 'src/network/network.module';

import { JwtAuthStrategy } from '../auth/strategies/jwt-auth.strategy';
import { SharedModule } from '../shared/shared.module';
import { UserTokenController } from './controllers/user-token.controller';
import { UserTokenRepository } from './repositories/user-token.repository';
import { MockUserTokenService } from './services/user-token.mock.service';
import { UserTokenService } from './services/user-token.service';
import { UserTokenAclService } from './services/user-token-acl.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([UserTokenRepository]),
    NetworkModule,
    DefaultTokenModule,
    HttpModule,
  ],
  providers: [
    UserTokenService,
    JwtAuthStrategy,
    UserTokenAclService,
    MockUserTokenService,
  ],
  controllers: [UserTokenController],
  exports: [UserTokenService, MockUserTokenService],
})
export class UserTokenModule {}
