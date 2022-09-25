import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CalcAmountInUSDInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  tokenSymbol: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  amount: number;
}
