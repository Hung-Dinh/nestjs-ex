import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RemoveMemberFromRoomInput {
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
