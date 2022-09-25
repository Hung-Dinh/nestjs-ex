import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class EncryptMessageInput {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  roomId: number;

  @ApiProperty()
  @IsString()
  @Type(() => String)
  message: string;
}
