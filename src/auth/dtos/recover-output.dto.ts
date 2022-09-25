import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserOutput } from 'src/user/dtos/user-output.dto';

export class RecoverOutput {
  @Expose()
  @ApiProperty()
  result: boolean;

  @Expose()
  @ApiProperty()
  message: string;

  @Expose()
  @ApiProperty()
  accessToken: string | null;

  @Expose()
  @ApiProperty()
  refreshToken: string | null;

  @Expose()
  @ApiProperty()
  user: UserOutput | null;
}
