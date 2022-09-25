import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CheckAddressInput {
  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  requestAddress: string;
}
