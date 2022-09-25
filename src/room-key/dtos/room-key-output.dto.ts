import { Expose, Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class RoomKeyOutput {
  @Expose()
  @IsString()
  id: string;

  @Expose()
  @IsNumber()
  @Type(() => Number)
  roomId: number;

  @Expose()
  @IsString()
  sharedKey: string;

  @Expose()
  @IsString()
  publicKey: string;

  @Expose()
  @IsString()
  privateKey: string;

  @Expose()
  @IsString()
  iv: string;

  @Expose()
  @IsString()
  side: string;
}
