import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DefaultTokenRepository } from 'src/default-token/repositories/default-token.repository';
import { NetworkModule } from 'src/network/network.module';
import { NetworkRepository } from 'src/network/repositories/network.repository';
import { SharedModule } from 'src/shared/shared.module';

import { DefaultTokenSeederService } from './services/default-token-seeder.service';
import { NetworkSeederService } from './services/network-seeder.service';
import { SeederService } from './services/seeder.service';


@Module({
  imports: [
    SharedModule,
    NetworkModule,
    TypeOrmModule.forFeature([NetworkRepository, DefaultTokenRepository]),
  ],
  providers: [NetworkSeederService, DefaultTokenSeederService, SeederService],
})
export class SeederModule {}
