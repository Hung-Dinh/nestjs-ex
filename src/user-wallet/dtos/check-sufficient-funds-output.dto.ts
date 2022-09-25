import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckSufficientFundOutput {
  @IsNumber()
  @Type(() => String)
  networkTokenBalance: string;

  @IsNumber()
  @Type(() => String)
  tokenBalance: string;

  @IsNumber()
  @Type(() => Number)
  transactionFee: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  amount?: number;

  @IsString()
  @Type(() => String)
  msg: string;

  @IsString()
  @Type(() => String)
  networkDefaultToken: string;

  @IsBoolean()
  @Type(() => Boolean)
  isSufficient: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  hasError: boolean;
}
