import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsNumber, IsString } from 'class-validator';

export class EditMemberRoleInput {
  @Expose()
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  roomId: number;

  @Expose()
  @ApiProperty()
  @IsArray()
  userIds: number[];

  @Expose()
  @ApiProperty()
  @IsString()
  role: string;
}
