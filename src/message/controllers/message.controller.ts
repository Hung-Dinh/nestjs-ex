import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  SetMetadata,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AUTH_HEADER } from 'src/auth/constants/strategy.constant';
import { AuthHeaderApiKeyGuard } from 'src/auth/guards/auth-header-api-key.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from 'src/shared/dtos/base-api-response.dto';
import { ChatNetworkGuard } from 'src/shared/guards/chat-network.guard';
import { AppLogger } from 'src/shared/logger/logger.service';
import { ReqContext } from 'src/shared/request-context/req-context.decorator';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { CreateFileMessageInput } from '../dtos/create-file-message-input.dto';
import { EncryptMessageInput } from '../dtos/encrypt-message-input.dto';
import { GetRoomFilesParamsDto } from '../dtos/get-room-files-params.dto';
import { GetRoomMessagesParamsDto } from '../dtos/get-room-messsage-params.dto';
import { MessageOutput } from '../dtos/message-output.dto';
import { SendMessageInput } from '../dtos/send-message-input.dto';
import { SendTokenChatInput } from '../dtos/send-token-chat-input.dto';
import { Message } from '../entities/message.entity';
import { MessageService } from '../services/message.service';

@ApiTags('message')
@Controller('message')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard, ChatNetworkGuard)
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MessageController.name);
  }

  @Put('/pin/:id')
  @ApiOperation({
    summary: 'pin a message',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async pinMessage(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<void> {
    this.logger.log(ctx, `${this.pinMessage.name} was called`);
    return this.messageService.pinMessageById(ctx, id);
  }

  @Put('/unpin/:id')
  @ApiOperation({
    summary: 'unpin a message',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async unpinMessage(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<void> {
    this.logger.log(ctx, `${this.pinMessage.name} was called`);
    return this.messageService.unpinMessageById(ctx, id);
  }

  @Get('/pinned-messages')
  @ApiOperation({
    summary: 'Get user me API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([MessageOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getPinnedMessages(
    @ReqContext() ctx: RequestContext,
    @Query() getPinnedMessageParams: GetRoomMessagesParamsDto,
  ): Promise<BaseApiResponse<MessageOutput[]>> {
    this.logger.log(ctx, `${this.getPinnedMessages.name} was called`);

    const { roomId, limit, offset } = getPinnedMessageParams;
    const { messages, count } = await this.messageService.getPinnedMessages(
      ctx,
      roomId,
      limit,
      offset,
    );

    return {
      data: messages,
      meta: {
        count: count,
      },
    };
  }

  @Get('/room-messages')
  @ApiOperation({
    summary: 'Get list messages in a room',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(MessageOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getRoomMessages(
    @ReqContext() ctx: RequestContext,
    @Query() query: GetRoomMessagesParamsDto,
  ): Promise<BaseApiResponse<MessageOutput[]>> {
    const { limit, offset, roomId } = query;

    const { messages, unreadMessageCount } =
      await this.messageService.getRoomMessagesNew(ctx, roomId, limit, offset);

    return {
      data: messages,
      meta: {
        unreadMessageCount,
      },
    };
  }

  @Post('/room-files')
  @ApiOperation({
    summary: 'Get list of room file message',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([MessageOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getRoomFiles(
    @ReqContext() ctx: RequestContext,
    @Body() input: GetRoomFilesParamsDto,
  ): Promise<BaseApiResponse<MessageOutput[]>> {
    const fileMessages = await this.messageService.getFileMessages(ctx, input);

    return {
      data: fileMessages,
      meta: {},
    };
  }

  @Get('/failed-room-notifications')
  @ApiOperation({
    summary: 'Get list failed approval and remove notifications in a room',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(MessageOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getFailedRoomNotifications(
    @ReqContext() ctx: RequestContext,
    @Query() query: GetRoomMessagesParamsDto,
  ): Promise<BaseApiResponse<MessageOutput[]>> {
    const { limit, offset, roomId } = query;

    const { messages } = await this.messageService.getFailedRoomNotifications(
      ctx,
      roomId,
      limit,
      offset,
    );

    return {
      data: messages,
      meta: {},
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get message detail',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(MessageOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getMessageById(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<BaseApiResponse<MessageOutput>> {
    const message = await this.messageService.getMessageById(ctx, id);

    return {
      data: message,
      meta: {},
    };
  }

  @Post('encrypt')
  @ApiOperation({
    summary: 'Get pinned messages',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(String),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async encryptMessage(
    @ReqContext() ctx: RequestContext,
    @Body() input: EncryptMessageInput,
  ): Promise<BaseApiResponse<string>> {
    this.logger.log(ctx, `${this.encryptMessage.name} was called`);
    const encryptedMessage = await this.messageService.encryptMessage(
      ctx,
      input,
    );
    return {
      data: encryptedMessage,
      meta: {},
    };
  }

  @Post('decrypt')
  @ApiOperation({
    summary: 'Get pinned messages',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(String),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async decryptMessage(
    @ReqContext() ctx: RequestContext,
    @Body() input: EncryptMessageInput,
  ): Promise<BaseApiResponse<string>> {
    this.logger.log(ctx, `${this.encryptMessage.name} was called`);
    const encryptedMessage = await this.messageService.decryptMessage(
      ctx,
      input,
    );
    return {
      data: encryptedMessage,
      meta: {},
    };
  }

  @Post('send-message')
  @ApiOperation({
    summary: 'user send message  API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(Message),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async sendMesssage(
    @ReqContext() ctx: RequestContext,
    @Body() input: SendMessageInput,
  ): Promise<BaseApiResponse<Message>> {
    this.logger.log(ctx, `${this.sendMesssage.name} was called`);
    const newMessage = await this.messageService.sendMessage(
      ctx,
      ctx.user.id,
      input,
    );
    return { data: newMessage, meta: {} };
  }

  @Put('/retrieve/:id')
  @ApiOperation({
    summary: 'user change message status API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async retrieveMessage(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<void> {
    this.logger.log(ctx, `${this.retrieveMessage.name} was called`);
    const test = await this.messageService.retrieveMessage(
      ctx,
      ctx.user.id,
      id,
    );
    console.log(test);
  }

  @Post('send-red-packet')
  @ApiOperation({
    summary: 'user send red packet  API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(Message),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async sendRedpacket(
    @ReqContext() ctx: RequestContext,
    @Body() input: SendTokenChatInput,
  ): Promise<BaseApiResponse<Message>> {
    this.logger.log(ctx, `${this.sendMesssage.name} was called`);
    const newMessage = await this.messageService.sendRedpacket(
      ctx,
      ctx.user.id,
      input,
    );
    return { data: newMessage, meta: {} };
  }

  @Put('/resend-message/:id')
  @ApiOperation({
    summary: 'resend failed message',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(MessageOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async resendMessage(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<BaseApiResponse<MessageOutput>> {
    this.logger.log(ctx, `${this.resendMessage.name} was called`);

    const messsage = await this.messageService.resendMessage(ctx, id);
    return { data: messsage, meta: {} };
  }

  @Post('send-file-message')
  @ApiOperation({
    summary: 'Send file message',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(Message),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @SetMetadata('ignore-chat-network-guard', true)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async createFileMessage(
    @ReqContext() ctx: RequestContext,
    @Body() input: CreateFileMessageInput,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BaseApiResponse<Message>> {
    this.logger.log(ctx, `${this.createFileMessage.name} was called`);

    const newMessage = await this.messageService.createFileMessage(
      ctx,
      input,
      file,
    );
    return { data: newMessage, meta: {} };
  }
}
