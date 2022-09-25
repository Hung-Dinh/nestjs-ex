import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { ROLE } from '../constants/role.constant';

export class RegisterInput {
  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(100)
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  confirmPassword: string;

  @ApiPropertyOptional()
  @ApiProperty()
  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  seedPhrase: string;

  @ApiProperty()
  @IsString()
  privateKey: string;

  @ApiProperty()
  @IsString()
  hdWalletPath: string;

  @ApiProperty()
  @IsString()
  walletAddress: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  networkId: number;

  // These keys can only be set by ADMIN user.
  roles: ROLE[] = [ROLE.USER];
  isAccountDisabled: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isExternal: boolean;
}
