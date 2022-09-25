import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BlockchainTxOutput {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  fromAddress: string;

  @Expose()
  @ApiProperty()
  toAddress: string;

  @Expose()
  @ApiProperty({ nullable: true })
  msgValue: string;

  @Expose()
  @ApiProperty()
  tokenSymbol: string;

  @Expose()
  @ApiProperty()
  tokenAddress: string;

  @Expose()
  @ApiProperty()
  networkId: string;

  @Expose()
  @ApiProperty({
    nullable: true,
  })
  feeAmount: string;

  @Expose()
  @ApiProperty({
    nullable: true,
  })
  feeSymbol: string;

  @Expose()
  @ApiProperty({
    nullable: true,
  })
  txStatus: string;

  @Expose()
  @ApiProperty()
  createdAt: string;

  @Expose()
  @ApiProperty()
  updatedAt: string;
}
