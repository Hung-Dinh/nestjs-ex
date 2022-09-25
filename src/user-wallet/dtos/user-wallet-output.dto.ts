import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserWalletOutput {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  userId: number;

  @Expose()
  @ApiProperty()
  walletName: string;

  @Expose()
  @ApiProperty()
  address: string;

  @Expose()
  @ApiProperty()
  isHD: boolean;

  @Expose()
  @ApiProperty()
  hadPath: string;

  @Expose()
  @ApiProperty()
  kmsDataKeyId: number;

  @Expose()
  @ApiProperty()
  isExternal: boolean;

  @Expose()
  @ApiProperty()
  currentBlockNumber: number;

  @Expose()
  @ApiProperty()
  networkId: number;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
