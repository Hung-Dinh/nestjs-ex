import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BlockedUserOutput {
  @Expose()
  @ApiProperty()
  userId: number;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  avatar: string;

  @Expose()
  @ApiProperty()
  address: string;

  @Expose()
  @ApiProperty()
  type: string;
}
