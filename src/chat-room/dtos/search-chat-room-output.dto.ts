import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SearchChatRoomOutput {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  roomName: string;

  @Expose()
  @ApiProperty()
  roomAvatar: string;

  @Expose()
  @ApiProperty()
  type: string;

  @Expose()
  @ApiProperty()
  content: string;

  @Expose()
  @ApiProperty()
  file: string;

  @Expose()
  @ApiProperty()
  downloadUrl: string;

  @Expose()
  @ApiProperty()
  lastUser: string;

  @Expose()
  @ApiProperty()
  lastPostTime: string;

  @Expose()
  @ApiProperty()
  lastViewedAt: string;

  @Expose()
  @ApiProperty()
  isGroup: boolean;

  @Expose()
  @ApiProperty()
  isPinned: boolean;

  @Expose()
  @ApiProperty()
  numberOfUnseenMessages: number;

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
  messageStatus: string;

  @Expose()
  @ApiProperty()
  isOwner: string;

  @Expose()
  @ApiProperty()
  networkId: number;

  @Expose()
  @ApiProperty()
  toAddress: string;

  @Expose()
  @ApiProperty()
  tokenSymbol: string;

  @Expose()
  @ApiProperty()
  amount: string;

  @Expose()
  @ApiProperty()
  notiMidContent: string;

  @Expose()
  @ApiProperty()
  notiEndContent: string;

  @Expose()
  @ApiProperty()
  notiType: string;
  
  @Expose()
  @ApiProperty() 
  fileInfo: string;

  @Expose()
  @ApiProperty()
  isUserBlocked: boolean;

  @Expose()
  @ApiProperty()
  walletAddress: string;

  @Expose()
  @ApiProperty()
  leavingStatus: string;
}
