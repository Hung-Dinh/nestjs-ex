import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class ChangeNetworkInput {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  networkId: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  walletId: number;
}
