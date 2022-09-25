import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserSettingOutput {
 
  @Expose()
  @ApiProperty()
  userId: number;

  @Expose()
  @ApiProperty()
  language: string;

  @Expose()
  @ApiProperty()
  displayCurrency: string;

  @Expose()
  @ApiProperty()
  biometrics: boolean;

  @Expose()
  @ApiProperty()
  useUserWalletId: number;

  @Expose()
  @ApiProperty()
  useNetworkId: number;

  @Expose()
  @ApiProperty()
  gasFeeLevel: string;

  @Expose()
  @ApiProperty()
  isEnableAutosignMessage: boolean;

  @Expose()
  @ApiProperty()
  displayName: string;

  @Expose()
  @ApiProperty()
  avatar: string;

  @Expose()
  @ApiProperty()
  defaultWalletAddress: string;

  @Expose()
  @ApiProperty()
  defaultRpcEndpoint: string;

  @Expose()
  @ApiProperty()
  networkName: string;

  @Expose()
  @ApiProperty()
  defaultTokenSymbol : string;

  @Expose()
  @ApiProperty()
  createdAt: string;

  @Expose()
  @ApiProperty()
  updatedAt: string;
}
