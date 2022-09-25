import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TransactionOutput {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  type: string;

  @Expose()
  @ApiProperty()
  userId: number;

  @Expose()
  @ApiProperty()
  useWalletId: number;

  @Expose()
  @ApiProperty()
  networkId: number;

  @Expose()
  @ApiProperty()
  txHash: string;

  @Expose()
  @ApiProperty()
  blockchainTxId: string;

  @Expose()
  @ApiProperty()
  fromAddress: string;

  @Expose()
  @ApiProperty()
  toAddress: string;

  @Expose()
  @ApiProperty()
  amount: number;

  @Expose()
  @ApiProperty()
  feeAmount: number;

  @Expose()
  @ApiProperty()
  feeSymbol: string;

  @Expose()
  @ApiProperty()
  total: string;

  @Expose()
  @ApiProperty()
  totalInUsd: string;

  @Expose()
  @ApiProperty()
  amountInUsd: string;

  @Expose()
  @ApiProperty()
  feeInUsd: string;

  @Expose()
  @ApiProperty()
  transactionStatus: string;

  @Expose()
  @ApiProperty()
  tokenSymbol: string;

  @Expose()
  @ApiProperty()
  tokenAddress: string;

  @Expose()
  @ApiPropertyOptional()
  refId: number;

  @Expose()
  @ApiPropertyOptional()
  refTable: string;

  @Expose()
  @ApiPropertyOptional()
  title: string;
  
  @Expose()
  @ApiPropertyOptional()
  titleKey: string;

  @Expose()
  @ApiProperty()
  createdAt: string;

  @Expose()
  @ApiProperty()
  updatedAt: string;
}
