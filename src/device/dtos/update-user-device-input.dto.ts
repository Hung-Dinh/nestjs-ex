import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDeviceInput {
  @ApiProperty()
  @IsString()
  deviceId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ApiProperty()
  @IsString()
  fcmToken: string;

  @ApiPropertyOptional()
  @ApiProperty()
  @IsOptional()
  @IsString()
  os?: string;
}
