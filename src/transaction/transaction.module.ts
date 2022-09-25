import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainTxModule } from 'src/blockchain-tx/blockchain-tx.module';
import { DefaultTokenModule } from 'src/default-token/default-token.module';
import { FileModule } from 'src/file/file.module';
import { MemberInRoomModule } from 'src/member-in-room/member-in-room.module';
import { MessageModule } from 'src/message/message.module';
import { NetworkModule } from 'src/network/network.module';
import { QUEUE_NAME } from 'src/shared/constants/queue.constant';
import { UserModule } from 'src/user/user.module';
import { UserContactModule } from 'src/user-contact/user-contact.module';
import { UserTokenModule } from 'src/user-token/user-token.module';
import { UserWalletModule } from 'src/user-wallet/user-wallet.module';

import { JwtAuthStrategy } from '../auth/strategies/jwt-auth.strategy';
import { SharedModule } from '../shared/shared.module';
import { TransactionController } from './controllers/transaction.controller';
import { TransactionRepository } from './repositories/transaction.repository';
import { TransactionService } from './services/transaction.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([TransactionRepository]),
    BullModule.registerQueue({
      name: QUEUE_NAME.WALLET,
    }),
    forwardRef(() => UserContactModule),
    forwardRef(() => UserWalletModule),
    forwardRef(() => UserTokenModule),
    forwardRef(() => MessageModule),
    forwardRef(() => MemberInRoomModule),
    UserModule,
    NetworkModule,
    DefaultTokenModule,
    BlockchainTxModule,
    forwardRef(() => FileModule),
  ],
  providers: [JwtAuthStrategy, TransactionService],
  controllers: [TransactionController],
  exports: [TransactionService],
})
export class TransactionModule {}
