import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';

export class MuteChatInput {
  
  @Expose()
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id: number;

  @Expose()
  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  muteUntillTime: Date;
}
