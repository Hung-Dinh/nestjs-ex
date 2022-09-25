import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BlockInput {
  @ApiProperty()
  @IsString()
  address: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  type: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reportContent: string;
}
