import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from 'src/file/file.module';

import { JwtAuthStrategy } from '../auth/strategies/jwt-auth.strategy';
import { SharedModule } from '../shared/shared.module';
import { UserController } from './controllers/user.controller';
import { UserRepository } from './repositories/user.repository';
import { UserMockService } from './services/user.mock.service';
import { UserService } from './services/user.service';
import { UserAclService } from './services/user-acl.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([UserRepository]),
    forwardRef(() => FileModule),
  ],
  providers: [UserService, JwtAuthStrategy, UserAclService, UserMockService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
