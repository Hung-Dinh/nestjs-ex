import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from 'src/shared/shared.module';

import { NetworkController } from './controllers/network.controller';
import { NetworkRepository } from './repositories/network.repository';
import { NetworkService } from './services/network.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([NetworkRepository])],
  providers: [NetworkService],
  controllers: [NetworkController],
  exports: [NetworkService],
})
export class NetworkModule {}
