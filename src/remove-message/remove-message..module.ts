import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoomModule } from 'src/chat-room/chat-room.module';
import { MemberInRoomModule } from 'src/member-in-room/member-in-room.module';
import { MessageModule } from 'src/message/message.module';
import { NetworkModule } from 'src/network/network.module';
import { SharedModule } from 'src/shared/shared.module';

import { RemoveMessageController } from './controllers/remove-message.controller';
import { RemoveMessageRepository } from './repositories/remove-message.repository';
import { RemoveMessageService } from './services/remove-message.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([RemoveMessageRepository]),
    MessageModule,
    ChatRoomModule,
    MemberInRoomModule,
    NetworkModule,
  ],
  providers: [RemoveMessageService],
  controllers: [RemoveMessageController],
  exports: [RemoveMessageService],
})
export class RemoveMessageModule {}
