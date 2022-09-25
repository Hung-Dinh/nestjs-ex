import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class SearchJoinedMemberListOutput {
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
  name: string;

  @Expose()
  @ApiProperty()
  @Type(() => String)
  avatar: string;

  @Expose()
  @ApiProperty()
  @Type(() => String)
  role: string;
}
