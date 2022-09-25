import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoomActionTxRepository } from './repositories/room-action-tx.repository';
import { RoomActionTxService } from './services/room-action-tx.service';

@Module({
  imports: [TypeOrmModule.forFeature([RoomActionTxRepository])],
  providers: [RoomActionTxService],
  exports: [RoomActionTxService],
})
export class RoomActionTxModule {}
