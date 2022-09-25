import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from 'src/file/file.module';
import { MemberInRoomModule } from 'src/member-in-room/member-in-room.module';
import { MessageModule } from 'src/message/message.module';
import { MessageTxModule } from 'src/message-tx/message-tx.module';
import { NetworkModule } from 'src/network/network.module';
import { RoomKeyModule } from 'src/room-key/room-key.module';
import { RoomNotificationTxModule } from 'src/room-notification-tx/room-notification-tx.module';
import { ChatHelperModule } from 'src/shared/chat-helper/chat-helper.module';
import { QUEUE_NAME } from 'src/shared/constants/queue.constant';
import { UserContactModule } from 'src/user-contact/user-contact.module';
import { UserSettingModule } from 'src/user-setting/user-setting.module';
import { UserTokenModule } from 'src/user-token/user-token.module';
import { UserWalletModule } from 'src/user-wallet/user-wallet.module';

import { JwtAuthStrategy } from '../auth/strategies/jwt-auth.strategy';
import { SharedModule } from '../shared/shared.module';
import { ChatRoomController } from './controllers/chat-room.controller';
import { ChatRoomRepository } from './repositories/chat-room.repository';
import { ChatRoomService } from './services/chat-room.service';
import { ChatRoomAclService } from './services/chat-room-acl.service';
import { SendNotificationService } from './services/send-notification.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([ChatRoomRepository]),
    forwardRef(() => UserWalletModule),
    forwardRef(() => MemberInRoomModule),
    forwardRef(() => MessageModule),
    forwardRef(() => MemberInRoomModule),
    forwardRef(() => RoomKeyModule),
    NetworkModule,
    forwardRef(() => UserSettingModule),
    BullModule.registerQueue(
      {
        name: QUEUE_NAME.CHAT,
      },
      {
        name: QUEUE_NAME.SOCKET,
      },
    ),
    MessageTxModule,
    ChatHelperModule,
    UserContactModule,
    UserTokenModule,
    forwardRef(() => FileModule),
    RoomNotificationTxModule,
  ],
  providers: [
    JwtAuthStrategy,
    ChatRoomAclService,
    ChatRoomService,
    SendNotificationService,
  ],
  controllers: [ChatRoomController],
  exports: [ChatRoomService, SendNotificationService],
})
export class ChatRoomModule {}
