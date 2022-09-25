import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SpamReportOutput {

  @Expose()
  @ApiProperty()
  id: number;
 
  @Expose()
  @ApiProperty()
  userId: number;

  @Expose()
  @ApiProperty()
  messageId: number;

  @Expose()
  @ApiProperty()
  content: string;

  @Expose()
  @ApiProperty()
  type: string;

  @Expose()
  @ApiProperty()
  status: string;

  @Expose()
  @ApiProperty()
  createdAt: string;

  @Expose()
  @ApiProperty()
  updatedAt: string;
}
