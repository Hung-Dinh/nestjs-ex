import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { ChatRoomModule } from 'src/chat-room/chat-room.module';
import { MessageModule } from 'src/message/message.module';
import { MessageTxModule } from 'src/message-tx/message-tx.module';
import { NetworkModule } from 'src/network/network.module';
import { RoomActionTxModule } from 'src/room-action-tx/room-action-tx.module';
import { RoomNotificationTxModule } from 'src/room-notification-tx/room-notification-tx.module';
import { UserSettingModule } from 'src/user-setting/user-setting.module';
import { UserWalletModule } from 'src/user-wallet/user-wallet.module';

import { QUEUE_NAME } from '../constants/queue.constant';
import { ChatHelperService } from './services/chat-helper.service';

@Module({
  imports: [
    forwardRef(() => UserSettingModule),
    forwardRef(() => ChatRoomModule),
    forwardRef(() => UserWalletModule),
    forwardRef(() => NetworkModule),
    forwardRef(() => MessageModule),
    forwardRef(() => MessageTxModule),
    RoomActionTxModule,
    RoomNotificationTxModule,
    BullModule.registerQueue({
      name: QUEUE_NAME.CHAT,
    }),
  ],
  exports: [ChatHelperService],
  providers: [ChatHelperService],
})
export class ChatHelperModule {}
