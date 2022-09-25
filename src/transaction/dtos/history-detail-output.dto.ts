import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class HistoryDetailOutput {
  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  titleKey: string;

  @Expose()
  @ApiProperty()
  detail: string;

  @Expose()
  @ApiProperty()
  fromAddress: string;

  @Expose()
  @ApiProperty()
  toAddress: string;

  @Expose()
  @ApiProperty()
  amount: string;

  @Expose()
  @ApiProperty()
  amountInUSD: string;

  @Expose()
  @ApiProperty()
  tokenAddress: string;

  @Expose()
  @ApiProperty()
  tokenSymbol: string;

  @Expose()
  @ApiProperty()
  feeSymbol: string;

  @Expose()
  @ApiProperty()
  feeAmount: string;

  @Expose()
  @ApiProperty()
  feeAmountInUSD: string;

  @Expose()
  @ApiProperty()
  status: string;

  @Expose()
  @ApiProperty()
  createdAt: string;

  @Expose()
  @ApiProperty()
  listTransactionHash: string[];

}
