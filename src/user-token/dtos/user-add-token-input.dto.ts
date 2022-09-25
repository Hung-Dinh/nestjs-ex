import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AddUserTokenInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  tokenAddress: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  tokenSymbol: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  networkId: number;
}
