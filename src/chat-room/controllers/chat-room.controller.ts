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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AUTH_HEADER } from 'src/auth/constants/strategy.constant';
import { AuthHeaderApiKeyGuard } from 'src/auth/guards/auth-header-api-key.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoomMemberListItemOutput } from 'src/member-in-room/dtos/room-member-list-item-output';
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from 'src/shared/dtos/base-api-response.dto';
import { PaginationParamsDto } from 'src/shared/dtos/pagination-params.dto';
import { ChatNetworkGuard } from 'src/shared/guards/chat-network.guard';
import { AppLogger } from 'src/shared/logger/logger.service';
import { ReqContext } from 'src/shared/request-context/req-context.decorator';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { AddGroupChatRoomInput } from '../dtos/add-group-chat-room-input.dto';
import { AddSingleChatRoomInput } from '../dtos/add-single-chat-room-input.dto';
import { ChatRoomOutput } from '../dtos/chat-room-output.dto';
import { SearchChatParamsDto } from '../dtos/search-chat-param.dto';
import { SearchChatRoomOutput } from '../dtos/search-chat-room-output.dto';
import { UpdateChatRoomInput } from '../dtos/update-chat-room-input.dto';
import { ChatRoomService } from '../services/chat-room.service';

@ApiTags('chat-room')
@Controller('chat-room')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard, ChatNetworkGuard)
export class ChatRoomController {
  constructor(
    private readonly chatRoomService: ChatRoomService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ChatRoomController.name);
  }

  @Get('/list')
  @ApiOperation({
    summary: 'Get chat room list API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([SearchChatRoomOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getMyChatRoomList(
    @ReqContext() ctx: RequestContext,
    @Query() query: SearchChatParamsDto,
  ): Promise<BaseApiResponse<SearchChatRoomOutput[]>> {
    this.logger.log(ctx, `${this.getMyChatRoomList.name} was called`);

    const { chats, count } = await this.chatRoomService.getChatRoomList(
      ctx,
      ctx.user.id,
      query.networkId,
      query.offset,
      query.limit,
    );
    return {
      data: chats,
      meta: {},
    };
  }

  /**
   * !! Legacy API
   */
  @Get('/invited-list')
  @ApiOperation({
    summary: 'Get invited chat room list API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([ChatRoomOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getInvitedChatRoomList(
    @ReqContext() ctx: RequestContext,
    @Query() query: PaginationParamsDto,
  ): Promise<BaseApiResponse<ChatRoomOutput[]>> {
    this.logger.log(ctx, `${this.getInvitedChatRoomList.name} was called`);

    const { chats, count } = await this.chatRoomService.getInvitedChatRoomList(
      ctx,
      ctx.user.id,
      query.offset,
      query.limit,
    );
    return {
      data: chats,
      meta: {},
    };
  }

  /**
   * !! Legacy API
   */
  @Get('/pinned-list')
  @ApiOperation({
    summary: 'Get pinned chat room list API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([SearchChatRoomOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getPinnedChatRoomList(
    @ReqContext() ctx: RequestContext,
    @Query() query: PaginationParamsDto,
  ): Promise<BaseApiResponse<SearchChatRoomOutput[]>> {
    this.logger.log(ctx, `${this.getPinnedChatRoomList.name} was called`);

    const { chats, count } = await this.chatRoomService.getPinnedChatRoomList(
      ctx,
      ctx.user.id,
      query.offset,
      query.limit,
    );
    return {
      data: chats,
      meta: {},
    };
  }

  @Get('/search')
  @ApiOperation({
    summary: 'search chat room by name or address API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([SearchChatRoomOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async searchChatRoom(
    @ReqContext() ctx: RequestContext,
    @Query() query: SearchChatParamsDto,
  ): Promise<BaseApiResponse<SearchChatRoomOutput[]>> {
    this.logger.log(ctx, `${this.searchChatRoom.name} was called`);

    const { chats, count } = await this.chatRoomService.searchChatRoom(
      ctx,
      ctx.user.id,
      query,
    );
    return {
      data: chats,
      meta: {},
    };
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'Get chat room detail API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getRoomDetail(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<BaseApiResponse<any>> {
    this.logger.log(ctx, `${this.getRoomDetail.name} was called`);
    const room = await this.chatRoomService.getRoomDetail(ctx, id);

    return {
      data: room,
      meta: {},
    };
  }

  @Post('find-create-single')
  @ApiOperation({
    summary: 'user create a single chat API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(ChatRoomOutput),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async findOrAddSingleChatRoom(
    @ReqContext() ctx: RequestContext,
    @Body() input: AddSingleChatRoomInput,
  ): Promise<BaseApiResponse<ChatRoomOutput>> {
    this.logger.log(ctx, `${this.findOrAddSingleChatRoom.name} was called`);
    const newChatRoom = await this.chatRoomService.findOrAddSingleChatRoom(
      ctx,
      ctx.user.id,
      input,
    );
    return { data: newChatRoom, meta: {} };
  }

  @Post('create-group')
  @ApiOperation({
    summary: 'user create a single chat API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(ChatRoomOutput),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async addGroupChatRoom(
    @ReqContext() ctx: RequestContext,
    @Body() input: AddGroupChatRoomInput,
  ): Promise<BaseApiResponse<ChatRoomOutput>> {
    this.logger.log(ctx, `${this.addGroupChatRoom.name} was called`);
    const newChatRoom = await this.chatRoomService.addGroupChatRoom(
      ctx,
      ctx.user.id,
      input,
    );
    return { data: newChatRoom, meta: {} };
  }

  @Put('/update')
  @ApiOperation({
    summary: 'update chat room',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(ChatRoomOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async updateChatRoom(
    @ReqContext() ctx: RequestContext,
    @Body() input: UpdateChatRoomInput,
  ): Promise<BaseApiResponse<ChatRoomOutput>> {
    this.logger.log(ctx, `${this.updateChatRoom.name} was called`);

    const chatRoom = await this.chatRoomService.updateChatRoom(ctx, input);
    return { data: chatRoom, meta: {} };
  }

  @Put('/resend/:id')
  @ApiOperation({
    summary: 'resend chat room',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(ChatRoomOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async resendChatRoom(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<BaseApiResponse<ChatRoomOutput>> {
    this.logger.log(ctx, `${this.resendChatRoom.name} was called`);

    const chatRoom = await this.chatRoomService.resendChatRoom(ctx, id);
    return { data: chatRoom, meta: {} };
  }

  @Put('/cancel_fail/:id')
  @ApiOperation({
    summary: 'resend chat room',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(ChatRoomOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async cancelFailChatRoom(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<BaseApiResponse<ChatRoomOutput>> {
    this.logger.log(ctx, `${this.cancelFailChatRoom.name} was called`);

    const chatRoom = await this.chatRoomService.removeFailChatRoom(ctx, id);
    return { data: chatRoom, meta: {} };
  }

  @Put('/mark-unread/:id')
  @ApiOperation({
    summary: 'mark unread a chat room',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async markAsUnreadChatRoom(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<void> {
    this.logger.log(ctx, `${this.markAsUnreadChatRoom.name} was called`);
    await this.chatRoomService.markAsUnreadChatRoom(ctx, id);
  }

  @Post('/join/:id')
  @ApiOperation({
    summary: 'join a chat room',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(RoomMemberListItemOutput),
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async joinChatRoom(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<BaseApiResponse<RoomMemberListItemOutput>> {
    this.logger.log(ctx, `${this.joinChatRoom.name} was called`);
    const updatedMember = await this.chatRoomService.joinRoom(ctx, id);
    return { data: updatedMember, meta: {} };
  }

  @Post('/leave/:id')
  @ApiOperation({
    summary: 'leave a chat room',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(RoomMemberListItemOutput),
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async leaveChatRoom(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<BaseApiResponse<RoomMemberListItemOutput>> {
    this.logger.log(ctx, `${this.joinChatRoom.name} was called`);
    const updatedMember = await this.chatRoomService.leaveRoom(ctx, id);
    return { data: updatedMember, meta: {} };
  }

  @Post('/reject-invitation/:id')
  @ApiOperation({
    summary: 'Reject invitation to join a chat room',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(RoomMemberListItemOutput),
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async rejectInvitation(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<BaseApiResponse<RoomMemberListItemOutput>> {
    this.logger.log(ctx, `${this.joinChatRoom.name} was called`);
    const updatedMember = await this.chatRoomService.rejectInvitation(ctx, id);
    return { data: updatedMember, meta: {} };
  }
}
