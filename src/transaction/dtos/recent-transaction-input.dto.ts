import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty,IsNumber } from 'class-validator';

export class RecentTransactionParamsDto {
  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @IsNotEmpty()
  networkId: number;
}