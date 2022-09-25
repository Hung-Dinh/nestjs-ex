import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class RoomMemberListItemOutput {
  @Expose()
  @ApiProperty()
  @Type(() => Number)
  id: number;

  @Expose()
  @ApiProperty()
  @Type(() => Number)
  chatRoomId: number;

  @Expose()
  @ApiProperty()
  @Type(() => Number)
  userId: number;

  @Expose()
  @ApiProperty()
  @Type(() => String)
  walletAddress: string;

  @Expose()
  @ApiProperty()
  @Type(() => String)
  displayName: string;

  @Expose()
  @ApiProperty()
  @Type(() => String)
  nickname: string;

  @Expose()
  @ApiProperty()
  @Type(() => String)
  role: string;

  @Expose()
  @ApiProperty()
  @Type(() => String)
  status: string;

  @Expose()
  @ApiProperty()
  @Type(() => Number)
  addedByUserId: number;

  @Expose()
  @ApiProperty()
  @Type(() => String)
  avatar: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
