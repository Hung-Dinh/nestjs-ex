import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
export class AddSpamReportInput {
  
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  messageId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content: string;

}
