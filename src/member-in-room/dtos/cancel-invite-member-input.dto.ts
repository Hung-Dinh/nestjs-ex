import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class CancelInviteMemberInput {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  roomId: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  userId: number;
}
