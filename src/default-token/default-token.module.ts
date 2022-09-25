import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthStrategy } from '../auth/strategies/jwt-auth.strategy';
import { SharedModule } from '../shared/shared.module';
import { DefaultTokenController } from './controllers/default-token.controller';
import { DefaultTokenRepository } from './repositories/default-token.repository';
import { DefaultTokenService } from './services/default-token.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([DefaultTokenRepository])],
  providers: [JwtAuthStrategy, DefaultTokenService],
  controllers: [DefaultTokenController],
  exports: [DefaultTokenService],
})
export class DefaultTokenModule {}
