import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UploadedFileOutput {
  @Expose()
  @ApiProperty()
  fileId: number;
}
