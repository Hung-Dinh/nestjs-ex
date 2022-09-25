import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ImportWalletOutput {
  @Expose()
  @ApiProperty()
  walletAddress: string;

  @Expose()
  @ApiProperty()
  privateKey: string;

  @Expose()
  @ApiProperty()
  seedPhrase: string;
}
