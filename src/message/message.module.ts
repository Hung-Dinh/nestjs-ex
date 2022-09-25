import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthStrategy } from 'src/auth/strategies/jwt-auth.strategy';
import { ChatRoomModule } from 'src/chat-room/chat-room.module';
import { FileModule } from 'src/file/file.module';
import { MemberInRoomModule } from 'src/member-in-room/member-in-room.module';
import { NetworkModule } from 'src/network/network.module';
import { RoomKeyModule } from 'src/room-key/room-key.module';
import { ChatHelperModule } from 'src/shared/chat-helper/chat-helper.module';
import { QUEUE_NAME } from 'src/shared/constants/queue.constant';
import { SharedModule } from 'src/shared/shared.module';
import { TransactionModule } from 'src/transaction/transaction.module';
import { UserModule } from 'src/user/user.module';
import { UserContactModule } from 'src/user-contact/user-contact.module';
import { UserSettingModule } from 'src/user-setting/user-setting.module';
import { UserTokenModule } from 'src/user-token/user-token.module';
import { UserWalletModule } from 'src/user-wallet/user-wallet.module';

import { MessageController } from './controllers/message.controller';
import { MessageRepository } from './respositories/message.repository';
import { MessageService } from './services/message.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([MessageRepository]),
    forwardRef(() => RoomKeyModule),
    UserModule,
    UserContactModule,
    forwardRef(() => UserSettingModule),
    NetworkModule,
    forwardRef(() => ChatRoomModule),
    forwardRef(() => MemberInRoomModule),
    BullModule.registerQueue(
      {
        name: QUEUE_NAME.CHAT,
      },
      {
        name: QUEUE_NAME.ENCRYPT_FILE,
      },
    ),
    forwardRef(() => ChatHelperModule),
    forwardRef(() => UserWalletModule),
    TransactionModule,
    UserTokenModule,
    forwardRef(() => FileModule),
  ],
  providers: [JwtAuthStrategy, MessageService],
  controllers: [MessageController],
  exports: [MessageService],
})
export class MessageModule {}
