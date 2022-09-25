import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { ROLE } from '../constants/role.constant';

export class AuthTokenOutput {
  @Expose()
  @ApiProperty()
  accessToken: string;

  @Expose()
  @ApiProperty()
  refreshToken: string;
}

export class UserAccessTokenClaims {
  @Expose()
  @Type(() => Number)
  id: number;

  @Expose()
  username: string;
  @Expose()
  roles: ROLE[];
}

export class UserRefreshTokenClaims {
  id: number;
}
