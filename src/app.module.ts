import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatRoomModule } from './chat-room/chat-room.module';
import { DefaultTokenModule } from './default-token/default-token.module';
import { DeviceModule } from './device/device.module';
import { FileModule } from './file/file.module';
import { KmsCmkModule } from './kms-cmk/kms-cmk.module';
import { KmsDataKeyModule } from './kms-data-key/kms-data-key.module';
import { MemberInRoomModule } from './member-in-room/member-in-room.module';
import { MessageModule } from './message/message.module';
import { NetworkModule } from './network/network.module';
import { RemoveMessageModule } from './remove-message/remove-message..module';
import { RoomKeyModule } from './room-key/room-key.module';
import { RoomNotificationTxModule } from './room-notification-tx/room-notification-tx.module';
import { RsaDecryptMiddleware } from './shared/middlewares/rsa-decrypt/rsa-decrypt.middleware';
import { SharedModule } from './shared/shared.module';
import { SpamReportModule } from './spam-report/spam-report.module';
import { TransactionModule } from './transaction/transaction.module';
import { UserModule } from './user/user.module';
import { UserBlockModule } from './user-block/user-block.module';
import { UserContactModule } from './user-contact/user-contact.module';
import { UserHdWalletModule } from './user-hdwallet/user-hdwallet.module';
import { UserSettingModule } from './user-setting/user-setting.module';
import { UserTokenModule } from './user-token/user-token.module';
import { UserWalletModule } from './user-wallet/user-wallet.module';

@Module({
  imports: [
    SharedModule,
    UserModule,
    AuthModule,
    UserWalletModule,
    UserHdWalletModule,
    UserTokenModule,
    DefaultTokenModule,
    TransactionModule,
    NetworkModule,
    DeviceModule,
    ChatRoomModule,
    MemberInRoomModule,
    MessageModule,
    UserContactModule,
    UserSettingModule,
    RoomKeyModule,
    RoomNotificationTxModule,
    KmsDataKeyModule,
    KmsCmkModule,
    FileModule,
    UserBlockModule,
    RemoveMessageModule,
    SpamReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RsaDecryptMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
