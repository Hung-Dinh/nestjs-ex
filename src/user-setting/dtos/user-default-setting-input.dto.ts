import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
export class UserDefaultSettingInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userWalletId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  networkId: number;
}
