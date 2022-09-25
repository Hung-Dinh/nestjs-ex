import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UnblockInput {
  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  requestAddress: string;
}
