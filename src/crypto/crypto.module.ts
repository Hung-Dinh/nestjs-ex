import { Module } from '@nestjs/common';

import { CryptoService } from './services/crypto.module';

@Module({
  imports: [],
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
