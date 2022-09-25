import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from 'src/shared/shared.module';

import { KmsCmkRepository } from './repositories/kms-cmk.repository';
import { KmsCmkService } from './services/kms-cmk.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([KmsCmkRepository])],
  providers: [KmsCmkService],
  exports: [KmsCmkService],
})
export class KmsCmkModule {}
