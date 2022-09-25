import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateHdWalletInput {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty()
  userId: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty()
  networkId: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  seedPhrase: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hdWalletPath: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isExternal: boolean;
}
