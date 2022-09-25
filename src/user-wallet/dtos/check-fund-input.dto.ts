import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CheckFundInput {
  @Expose()
  @ApiPropertyOptional()
  chatRoomId?: number;

  @Expose()
  @ApiProperty()
  type: string;

  @Expose()
  @ApiProperty()
  data: any;
}
