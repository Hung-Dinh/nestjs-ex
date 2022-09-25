import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class GetUserContactDetail {
  @ApiProperty()
  @IsString()
  requestAddress: string;

  @ApiProperty()
  @IsNumber()
  id: number;
}
