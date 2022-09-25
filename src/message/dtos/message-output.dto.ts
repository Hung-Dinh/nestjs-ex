import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MessageOutput {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  chatRoomId: string;

  @Expose()
  @ApiProperty()
  userId: string;

  @Expose()
  @ApiProperty()
  displayName: string;

  @Expose()
  @ApiProperty()
  userAvatar: string;

  @Expose()
  @ApiProperty()
  replyTo: number;

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
  isPinned: boolean;

  @Expose()
  @ApiProperty()
  status: string;

  @Expose()
  @ApiPropertyOptional()
  transactionId?: number;

  @Expose()
  @ApiProperty()
  createdAt: string;

  @Expose()
  @ApiProperty()
  updatedAt: string;

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
  sendTokenTxHash: string;

  @Expose()
  @ApiPropertyOptional()
  fileInfo: string;

  @Expose()
  @ApiProperty()
  walletAddress: string;
}
