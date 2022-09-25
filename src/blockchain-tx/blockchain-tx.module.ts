import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from 'src/shared/shared.module';

import { BlockchainTxRepository } from './repositories/blockchain-tx.repository';
import { BlockchainTxService } from './services/blockchain-tx.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([BlockchainTxRepository])],
  providers: [BlockchainTxService],
  controllers: [],
  exports: [BlockchainTxService],
})
export class BlockchainTxModule {}
