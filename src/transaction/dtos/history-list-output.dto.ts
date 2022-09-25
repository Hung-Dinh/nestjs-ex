import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class HistoryListOutput {
  @Expose()
  @ApiProperty()
  refId: number;

  @Expose()
  @ApiProperty()
  status: string;

  @Expose()
  @ApiProperty()
  amount: string;

  @Expose()
  @ApiProperty()
  tokenSymbol: string;

  @Expose()
  @ApiProperty()
  createdAt: string;

  @Expose()
  @ApiProperty()
  title: string;
  
  @Expose()
  @ApiProperty()
  titleKey: string;

  @Expose()
  @ApiProperty()
  type: string;

}
