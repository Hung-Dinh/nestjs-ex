import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class NetworkFeesOutput {
  @Expose()
  @ApiProperty()
  speed: string;

  @Expose()
  @ApiProperty()
  price: string;

  @Expose()
  @ApiProperty()
  time: string;

  @Expose()
  @ApiProperty()
  priceSymbol: string;

  @Expose()
  @ApiProperty()
  priceInUSD: string;
}
