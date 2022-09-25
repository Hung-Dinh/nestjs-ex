import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { RedisModule } from 'src/shared/redis/redis.module';

import { CoinPriceService } from './services/coin-price.service';
import { NetworkFeeService } from './services/network-fee.service';

@Module({
  imports: [HttpModule, RedisModule],
  providers: [CoinPriceService, NetworkFeeService],
  exports: [CoinPriceService, NetworkFeeService],
})
export class JobModule {}
