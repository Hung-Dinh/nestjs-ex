import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DeviceOutput {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  userId: string;

  @Expose()
  @ApiProperty()
  deviceId: string;

  @Expose()
  @ApiProperty()
  fcmToken: string;

  @Expose()
  @ApiProperty()
  os: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
