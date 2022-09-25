import { Module } from '@nestjs/common';

import { IpfsUploadService } from './services/ipfs.service';
import { LocalUploadService } from './services/local.service';
import { S3UploadService } from './services/s3.service';

@Module({
  providers: [LocalUploadService, S3UploadService, IpfsUploadService],
  exports: [LocalUploadService, S3UploadService, IpfsUploadService],
})
export class UploadModule {}
