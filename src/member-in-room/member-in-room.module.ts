import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthStrategy } from 'src/auth/strategies/jwt-auth.strategy';
import { ChatRoomModule } from 'src/chat-room/chat-room.module';
import { FileModule } from 'src/file/file.module';
import { MessageModule } from 'src/message/message.module';
import { MessageTxModule } from 'src/message-tx/message-tx.module';
import { NetworkModule } from 'src/network/network.module';
import { RoomNotificationTxModule } from 'src/room-notification-tx/room-notification-tx.module';
import { ChatHelperModule } from 'src/shared/chat-helper/chat-helper.module';
import { QUEUE_NAME } from 'src/shared/constants/queue.constant';
import { SharedModule } from 'src/shared/shared.module';
import { UserModule } from 'src/user/user.module';
import { UserBlockModule } from 'src/user-block/user-block.module';
import { UserContactModule } from 'src/user-contact/user-contact.module';
import { UserSettingModule } from 'src/user-setting/user-setting.module';
import { UserWalletModule } from 'src/user-wallet/user-wallet.module';

import { MemberInRoomController } from './controllers/member-in-room.controller';
import { MemberInRoomRepository } from './repositories/member-in-room.repository';
import { MemberInRoomService } from './services/member-in-room.service';
import { MemberInRoomAclService } from './services/member-in-room-acl.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([MemberInRoomRepository]),
    UserContactModule,
    UserModule,
    forwardRef(() => UserWalletModule),
    MessageModule,
    forwardRef(() => UserSettingModule),
    NetworkModule,
    forwardRef(() => ChatRoomModule),
    BullModule.registerQueue({
      name: QUEUE_NAME.CHAT,
    }),
    MessageTxModule,
    ChatHelperModule,
    forwardRef(() => FileModule),
    RoomNotificationTxModule,
  ],
  providers: [JwtAuthStrategy, MemberInRoomAclService, MemberInRoomService],
  controllers: [MemberInRoomController],
  exports: [MemberInRoomService],
})
export class MemberInRoomModule {}
