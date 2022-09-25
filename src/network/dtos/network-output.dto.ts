import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class NetworkOutput {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  chainName: string;

  @Expose()
  @ApiProperty()
  chainId: string;

  @Expose()
  @ApiProperty()
  rpcEndpoint: string;

  @Expose()
  @ApiProperty()
  explorerEndpoint: string;

  @Expose()
  @ApiProperty()
  blockTime: number;

  @Expose()
  @ApiProperty()
  nativeTokenSymbol: string;

  @Expose()
  @ApiProperty()
  blockConfirmation: number;

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
