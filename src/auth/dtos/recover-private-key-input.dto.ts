import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RecoverPrivateKeyInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  privateKey: string;
}
