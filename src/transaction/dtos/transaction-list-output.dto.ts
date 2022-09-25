import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TransactionListOutput {
  @Expose()
  @ApiProperty()
  result: boolean;

  @Expose()
  @ApiProperty()
  accessToken: string | null;
}
