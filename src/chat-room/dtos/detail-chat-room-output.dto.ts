import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ChatRoomDetailOutput {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  ownerId: number;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  avatar: string;

  @Expose()
  @ApiProperty()
  isGroup: boolean;

  @Expose()
  @ApiProperty()
  contractAddress: string;

  @Expose()
  @ApiProperty()
  channelId: string;

  @Expose()
  @ApiProperty()
  networkId: string;

  @Expose()
  @ApiProperty()
  status: string;

  @Expose()
  @ApiProperty()
  lastViewedAt: string;

  @Expose()
  @ApiProperty()
  createdAt: string;

  @Expose()
  @ApiProperty()
  updatedAt: string;

  @Expose()
  @ApiProperty()
  isPinned: boolean;

  @Expose()
  @ApiProperty()
  muteDuration: Date;

  @Expose()
  @ApiProperty()
  memberStatus: string;

  @Expose()
  @ApiProperty()
  chatRoomSatus: string;

  @Expose()
  @ApiProperty()
  isOwner : string;
}
