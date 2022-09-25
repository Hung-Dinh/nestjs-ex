import { ApiProperty } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class AddGroupChatRoomInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  networkId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  listAddress: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar: string;
}
