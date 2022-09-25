import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber } from 'class-validator';

export class ApproveMembersInput {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  roomId: number;

  @ApiProperty()
  @IsArray()
  addresses: string[];
}
