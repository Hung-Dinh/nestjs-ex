import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config } from 'aws-sdk';
import * as express from 'express';

// import path from 'path/posix';
import { AppModule } from './app.module';
import { AUTH_HEADER } from './auth/constants/strategy.constant';
import { AWS_ENABLED, UPLOAD_STRATEGY } from './shared/configs/secret';
import { VALIDATION_PIPE_OPTIONS } from './shared/constants';
import { RequestIdMiddleware } from './shared/middlewares/request-id/request-id.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe(VALIDATION_PIPE_OPTIONS));
  app.use(RequestIdMiddleware);
  app.enableCors();

  /** Swagger configuration*/
  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      {
        name: AUTH_HEADER.API_KEY,
        in: 'header',
        type: 'apiKey',
      },
      AUTH_HEADER.API_KEY,
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('swagger', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port');

  if (AWS_ENABLED || UPLOAD_STRATEGY === 's3') {
    config.update({
      accessKeyId: configService.get<string>('aws.accessKeyId'),
      secretAccessKey: configService.get<string>('aws.secretAccessKey'),
      region: configService.get<string>('aws.region'),
    });
  }

  if (UPLOAD_STRATEGY !== 's3') {
    const uploadPath = process.cwd() + '/uploads';
    console.log('uploadPath', uploadPath);
    app.use('/uploads', express.static(uploadPath));
  }

  await app.listen(port);
}
bootstrap();
