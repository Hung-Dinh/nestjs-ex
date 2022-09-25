import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UploadedFilesOutput {
  @Expose()
  @ApiProperty()
  fileIds: number[];
}
