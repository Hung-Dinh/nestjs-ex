import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TestKmsInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  text: string;
}
