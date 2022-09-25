import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KmsCmkModule } from 'src/kms-cmk/kms-cmk.module';
import { SharedModule } from 'src/shared/shared.module';

import { KmsDataKeyController } from './controllers/kms-data-key.controller';
import { KmsDataKeyRepository } from './repositories/kms-data-key.repository';
import { KmsDataKeyService } from './services/kms-data-key.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([KmsDataKeyRepository]),
    KmsCmkModule,
  ],
  exports: [KmsDataKeyService],
  providers: [KmsDataKeyService],
  controllers: [KmsDataKeyController],
})
export class KmsDataKeyModule {}
