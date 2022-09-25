import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from 'src/shared/shared.module';

import { MessageTxRepository } from './repositories/message-tx.repository';
import { MessageTxService } from './services/message-tx.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([MessageTxRepository])],
  exports: [MessageTxService],
  providers: [MessageTxService],
})
export class MessageTxModule {}
