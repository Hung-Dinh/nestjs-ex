import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from 'src/file/file.module';
import { SharedModule } from 'src/shared/shared.module';
import { UserModule } from 'src/user/user.module';
import { UserContactModule } from 'src/user-contact/user-contact.module';
import { UserWalletModule } from 'src/user-wallet/user-wallet.module';

import { UserBlockController } from './controllers/user-block.controller';
import { UserBlockRepository } from './repositories/user-block.repository';
import { UserBlockService } from './services/user-block.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([UserBlockRepository]),
    UserModule,
    UserContactModule,
    forwardRef(() => FileModule),
    UserWalletModule,
  ],
  providers: [UserBlockService],
  exports: [UserBlockService],
  controllers: [UserBlockController],
})
export class UserBlockModule {}
