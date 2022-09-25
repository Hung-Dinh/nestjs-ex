import { ApiProperty } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SendMessageInput {
  
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  chatRoomId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  replyTo: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  file: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  downloadUrl: string;

}
