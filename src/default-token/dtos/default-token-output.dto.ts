import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DefaultTokenOutput {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  networkId: number;

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
  idEnabled: boolean;

  @Expose()
  @ApiProperty()
  logo: string;

  @Expose()
  @ApiProperty()
  createdAt: string;

  @Expose()
  @ApiProperty()
  updatedAt: string;
}
