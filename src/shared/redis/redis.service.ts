import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../configs/secret';

@Injectable()
export class RedisService {
  redis: Redis.Redis;

  constructor() {
    this.redis = new Redis(REDIS_PORT, REDIS_HOST, {
      password: REDIS_PASSWORD,
    });
  }

  async get(key: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.redis.get(key, function (err, result) {
        if (err) {
          reject(err);
        }

        // reply is null when the key is missing
        resolve(result);
      });
    });
  }

  async set(key: string, value: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.redis.set(key, value, function (err, result) {
        if (err) {
          reject(err);
        }
        // reply is null when the key is missing
        resolve(result);
      });
    });
  }
}
