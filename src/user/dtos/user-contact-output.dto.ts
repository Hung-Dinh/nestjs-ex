import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';


export class UserContactOutput {
  
  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  avatar: string;

  @Expose()
  @ApiProperty()
  address: string;
  
  @Expose()
  @ApiProperty()
  userContactId: string;
}