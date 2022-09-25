import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class CreateFileMessageInput {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  chatRoomId: number;

  @ApiProperty()
  @IsString()
  @Type(() => String)
  fileInfo: string;
}
