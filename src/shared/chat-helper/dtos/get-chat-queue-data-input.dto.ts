import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetChatQueueDataInput {
  @IsNumber()
  roomId: number;

  @IsNumber()
  fromUserId: number;

  @IsString()
  fromWalletAddress: string;

  @IsString()
  toWalletAddresses: string[];

  @IsString()
  messageContents: string[];

  @IsString()
  messageType: string;

  @IsString()
  jobName: string;

  @IsString()
  @IsOptional()
  data?: string;

  @IsString()
  @IsOptional()
  feeLevel?: string;

  @IsNumber()
  @IsOptional()
  messageId?: number;

  @IsNumber()
  @IsOptional()
  transactionId?: number;

  @IsString()
  @IsOptional()
  tokenAmount?: string;

  @IsNumber()
  @IsOptional()
  tokenDecimal?: number;
}
