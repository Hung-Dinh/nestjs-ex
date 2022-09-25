import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
export class AddRemoveMessageInput {
  
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  messageId: number;

}
