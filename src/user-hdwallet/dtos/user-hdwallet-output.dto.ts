import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserHdWalletOutput {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  useId: number;

  @Expose()
  @ApiProperty()
  walletName: string;

  @Expose()
  @ApiProperty()
  isHD: boolean;

  @Expose()
  @ApiProperty()
  hdPath: string;

  @Expose()
  @ApiProperty()
  kmsDataKeyId: number;

  @Expose()
  @ApiProperty()
  isExternal: boolean;

  @Expose()
  @ApiProperty()
  networkId: number;

  @Expose()
  @ApiProperty()
  updatedAt: string;
}
