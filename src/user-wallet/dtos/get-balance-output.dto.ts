import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GetBalanceOutput {
  @Expose()
  @ApiProperty()
  userTokenId: number;

  @Expose()
  @ApiProperty()
  tokenName: string;

  @Expose()
  @ApiProperty()
  tokenSymbol: string;

  @Expose()
  @ApiProperty()
  tokenAddress: string;

  @Expose()
  @ApiProperty()
  tokenDecimal: number;

  @Expose()
  @ApiProperty()
  logo: string;

  @Expose()
  @ApiProperty()
  tokenBalance: string;

  @Expose()
  @ApiProperty()
  usdBalance: string;

  @Expose()
  @ApiProperty()
  usdRate: string;
}
