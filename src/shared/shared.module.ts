import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobModule } from 'src/jobs/job.module';

import { BlockchainService } from './blockchain-service/blockchain-service.service';
import { configModuleOptions } from './configs/module-options';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { AppLoggerModule } from './logger/logger.module';
import { RsaService } from './middlewares/rsa-decrypt/rsa-decrypt.service';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions),
    TypeOrmModule.forRootAsync({
      // name: 'default',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          type: 'mysql',
          keepConnectionAlive: true,
          host: configService.get<string>('database.host'),
          port: configService.get<number | undefined>('database.port'),
          database: configService.get<string>('database.name'),
          username: configService.get<string>('database.user'),
          password: configService.get<string>('database.pass'),
          charset: configService.get<string>('database.charset'),
          // replication: {
          //   master: {
          //     host: configService.get<string>('database.host'),
          //     port: configService.get<number | undefined>('database.port'),
          //     database: configService.get<string>('database.name'),
          //     username: configService.get<string>('database.user'),
          //     password: configService.get<string>('database.pass'),
          //     charset: configService.get<string>('database.charset'),
          //     logging: configService.get<string>('env') === 'development',
          //   },
          //   slaves: [
          //     {
          //       host: configService.get<string>('database_slaves[0].host'),
          //       port: configService.get<number | undefined>(
          //         'database_slaves[0].port',
          //       ),
          //       database: configService.get<string>('database_slaves[0].name'),
          //       username: configService.get<string>('database_slaves[0].user'),
          //       password: configService.get<string>('database_slaves[0].pass'),
          //       charset: configService.get<string>('database.charset'),
          //     },
          //   ],
          // },
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          // Timezone configured on the MySQL server.
          // This is used to typecast server date/time values to JavaScript Date object and vice versa.
          timezone: 'Z',
          synchronize: false,
          logging: true,
          // debug: configService.get<string>('env') === 'development',
        };
      },
    }),
    /*TypeOrmModule.forRootAsync({
      name: 'slave',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          type: 'mysql',
          keepConnectionAlive: true,
          host: configService.get<string>('database.host'),
          port: configService.get<number | undefined>('database.port'),
          database: configService.get<string>('database.name'),
          username: configService.get<string>('database.user'),
          password: configService.get<string>('database.pass'),
          entities: [__dirname + '/../!**!/!*.entity{.ts,.js}'],
          // Timezone configured on the MySQL server.
          // This is used to typecast server date/time values to JavaScript Date object and vice versa.
          timezone: 'Z',
          synchronize: false,
          logging: true,
          // debug: configService.get<string>('env') === 'development',
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      name: 'master',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          type: 'mysql',
          keepConnectionAlive: true,
          host: configService.get<string>('database.host'),
          port: configService.get<number | undefined>('database.port'),
          database: configService.get<string>('database.name'),
          username: configService.get<string>('database.user'),
          password: configService.get<string>('database.pass'),
          entities: [__dirname + '/../!**!/!*.entity{.ts,.js}'],
          // Timezone configured on the MySQL server.
          // This is used to typecast server date/time values to JavaScript Date object and vice versa.
          timezone: 'Z',
          synchronize: false,
          logging: true,
          // debug: configService.get<string>('env') === 'development',
        };
      },
    }),*/
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          redis: {
            host: configService.get<string>('redis.host'),
            port: configService.get<number>('redis.port'),
          },
        };
      },
    }),
    AppLoggerModule,
    ScheduleModule.forRoot(),
    RedisModule,
    JobModule,
  ],
  exports: [
    AppLoggerModule,
    ConfigModule,
    RsaService,
    BlockchainService,
    JobModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },

    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    RsaService,
    BlockchainService,
  ],
})
export class SharedModule {}
