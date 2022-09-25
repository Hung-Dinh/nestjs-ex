import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-headerapikey';

import { AUTH_HEADER,STRATEGY_API_KEY } from '../constants/strategy.constant';

@Injectable()
export class HeaderApiKeyStrategy extends PassportStrategy(
  Strategy,
  STRATEGY_API_KEY,
) {
  constructor(private readonly configService: ConfigService) {
    super({ header: AUTH_HEADER.API_KEY, prefix: '' }, true, async (apiKey, done) => {
      return this.validate(apiKey, done);
    });
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  public validate = (apiKey: string, done: (error: Error, data) => {}) => {
    if (this.configService.get<string>('defaultApiKey') === apiKey) {
      done(null, true);
    }
    done(new Error('Invalid API Key'), null);
  };
}
