import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoModule } from 'src/crypto/crypto.module';
import { RoomKeyModule } from 'src/room-key/room-key.module';
import { SharedModule } from 'src/shared/shared.module';
import { UploadModule } from 'src/upload/upload.module';

import { FileController } from './controllers/file.controller';
import { FileRepository } from './repositories/file.repository';
import { FileService } from './services/file.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([FileRepository]),
    UploadModule,
    forwardRef(() => RoomKeyModule),
    CryptoModule,
  ],
  providers: [FileService],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}
