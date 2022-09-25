import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';
export class AddUserSettingInput {
  
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  language: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  displayCurrency: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  biometrics: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  useUserWalletId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  useNetworkId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  gasFeeLevel: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isEnableAutosignMessage: boolean;
}
