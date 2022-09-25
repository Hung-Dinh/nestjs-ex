import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';

export class CanDoActionInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  addresses: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  roomId: number;
}
