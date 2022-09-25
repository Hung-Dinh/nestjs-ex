import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoomNotificationTxRepository } from './repositories/room-notification-tx.repository';
import { RoomNotificationTxService } from './services/room-notification-tx.service';

@Module({
  imports: [TypeOrmModule.forFeature([RoomNotificationTxRepository])],
  providers: [RoomNotificationTxService],
  exports: [RoomNotificationTxService],
})
export class RoomNotificationTxModule {}
