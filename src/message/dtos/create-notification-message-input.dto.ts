import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class CreateNotificationMessageInput {
  @IsNumber()
  @Type(() => Number)
  chatRoomId: number;

  @IsNumber()
  @Type(() => Number)
  userId: number;

  @IsNumber()
  @Type(() => String)
  walletAddress: string;

  @IsString()
  @Type(() => String)
  content: string;

  @IsString()
  @Type(() => String)
  status?: string;
}
