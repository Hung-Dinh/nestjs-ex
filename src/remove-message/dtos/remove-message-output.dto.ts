import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RemoveMessageOutput {

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
  createdAt: string;

  @Expose()
  @ApiProperty()
  updatedAt: string;
}
