import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoomModule } from 'src/chat-room/chat-room.module';
import { MemberInRoomModule } from 'src/member-in-room/member-in-room.module';
import { MessageModule } from 'src/message/message.module';
import { NetworkModule } from 'src/network/network.module';
import { SharedModule } from 'src/shared/shared.module';

import { RoomKeyController } from './controllers/room-key.controller';
import { RoomKeyRepository } from './repositories/room-key.repository';
import { RoomKeyService } from './services/room-key.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([RoomKeyRepository]),
    forwardRef(() => MemberInRoomModule),
    NetworkModule,
    ChatRoomModule,
    MessageModule,
  ],
  providers: [RoomKeyService],
  exports: [RoomKeyService],
  controllers: [RoomKeyController],
})
export class RoomKeyModule {}
