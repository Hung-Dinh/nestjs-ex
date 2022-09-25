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
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from 'src/shared/dtos/base-api-response.dto';
import { ChatNetworkGuard } from 'src/shared/guards/chat-network.guard';
import { AppLogger } from 'src/shared/logger/logger.service';
import { ReqContext } from 'src/shared/request-context/req-context.decorator';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { AddMembersToRoomInput } from '../dtos/add-member-input.dto';
import { ApproveMembersInput } from '../dtos/approve-member-input.dto';
import { CancelInviteMemberInput } from '../dtos/cancel-invite-member-input.dto';
import { CanDoActionInput } from '../dtos/check-can-do-action-input.dto';
import { EditMemberRoleInput } from '../dtos/edit-member-role-input.dto';
import { GetMemberListInRoomParamsDto } from '../dtos/get-member-list-in-room-params.dto';
import { MuteChatInput } from '../dtos/mute-chat-input.dto';
import { IdParamsDto } from '../dtos/param-id.dto';
import { RemoveMemberFromRoomInput } from '../dtos/remove-member-input.dto';
import { RoomMemberDetailOutput } from '../dtos/room-member-detail-output.dto';
import { RoomMemberListItemOutput } from '../dtos/room-member-list-item-output';
import { SearchJoinedMemberListOutput } from '../dtos/search-joined-member-list-output';
import { SearchJoinedMemberListParamsDto } from '../dtos/search-joined-member-list-params.dto';
import { MemberInRoomService } from '../services/member-in-room.service';

@ApiTags('member-in-room')
@Controller('member-in-room')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard, ChatNetworkGuard)
export class MemberInRoomController {
  constructor(
    private readonly memberInRoomService: MemberInRoomService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MemberInRoomController.name);
  }

  @Put('/mute')
  @ApiOperation({
    summary: 'mute a chat room',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async muteChatRoom(
    @ReqContext() ctx: RequestContext,
    @Body() input: MuteChatInput,
  ): Promise<void> {
    this.logger.log(ctx, `${this.muteChatRoom.name} was called`);
    return this.memberInRoomService.muteChatRoomById(ctx, input);
  }

  @Put('/unmute/:id')
  @ApiOperation({
    summary: 'mute a chat room',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async unmuteChatRoom(
    @ReqContext() ctx: RequestContext,
    @Param() id: IdParamsDto,
  ): Promise<void> {
    this.logger.log(ctx, `${this.unmuteChatRoom.name} was called`);
    return this.memberInRoomService.unmuteChatRoomById(ctx, id.id);
  }

  @Put('/pin/:id')
  @ApiOperation({
    summary: 'pin a chat room',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async pinChatRoom(
    @ReqContext() ctx: RequestContext,
    @Param() id: IdParamsDto,
  ): Promise<void> {
    this.logger.log(ctx, `${this.pinChatRoom.name} was called`);
    return this.memberInRoomService.pinChatRoomById(ctx, id.id);
  }

  @Put('/unpin/:id')
  @ApiOperation({
    summary: 'unpin a chat room',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async unpinChatRoom(
    @ReqContext() ctx: RequestContext,
    @Param() id: IdParamsDto,
  ): Promise<void> {
    this.logger.log(ctx, `${this.pinChatRoom.name} was called`);
    return this.memberInRoomService.unpinChatRoomById(ctx, id.id);
  }

  @Get('list')
  @ApiOperation({
    summary: 'get member in room list',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([RoomMemberListItemOutput]),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getMemberInRoomList(
    @ReqContext() ctx: RequestContext,
    @Query() getMemberListInRoomParams: GetMemberListInRoomParamsDto,
  ): Promise<BaseApiResponse<RoomMemberListItemOutput[]>> {
    this.logger.log(ctx, `${this.getMemberInRoomList.name} was called`);

    const { limit, offset, roomId, memberStatus } = getMemberListInRoomParams;
    const { members, count } = await this.memberInRoomService.getRoomMemberList(
      ctx,
      roomId,
      memberStatus,
      limit,
      offset,
    );

    return {
      data: members,
      meta: {
        count,
      },
    };
  }

  @Get('/search-joined')
  @ApiOperation({
    summary: 'search joined member in room list',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([SearchJoinedMemberListOutput]),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async searchJoinedRoomMembers(
    @ReqContext() ctx: RequestContext,
    @Query() getMemberListInRoomParams: SearchJoinedMemberListParamsDto,
  ): Promise<BaseApiResponse<SearchJoinedMemberListOutput[]>> {
    this.logger.log(ctx, `${this.searchJoinedRoomMembers.name} was called`);

    const { limit, offset, roomId, nameOrAddress } = getMemberListInRoomParams;
    const { members, count } =
      await this.memberInRoomService.searchJoinedRoomMembers(
        ctx,
        roomId,
        nameOrAddress,
        limit,
        offset,
      );

    return {
      data: members,
      meta: {
        count,
      },
    };
  }

  @Post('/add-member')
  @ApiOperation({
    summary: 'get member in room list',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([RoomMemberListItemOutput]),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async addMemberToRoom(
    @ReqContext() ctx: RequestContext,
    @Body() input: AddMembersToRoomInput,
  ): Promise<BaseApiResponse<RoomMemberListItemOutput[]>> {
    const newMembersList = await this.memberInRoomService.addMemberListToRoom(
      ctx,
      input,
    );
    return {
      data: newMembersList,
      meta: {},
    };
  }

  @Post('/remove-member')
  @ApiOperation({
    summary: 'get member in room list',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async removeMemberFromRoom(
    @ReqContext() ctx: RequestContext,
    @Body() input: RemoveMemberFromRoomInput,
  ): Promise<void> {
    await this.memberInRoomService.removeMemberFromRoom(ctx, input);
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'get member detail',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(RoomMemberDetailOutput),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getMemberDetailInRoom(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<BaseApiResponse<RoomMemberDetailOutput>> {
    this.logger.log(ctx, `${this.getMemberDetailInRoom.name} was called`);
    const member = await this.memberInRoomService.getRoomMemberDetail(ctx, id);
    return {
      data: member,
      meta: {},
    };
  }

  @Post('/approve')
  @ApiOperation({
    summary: 'approve member in room',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([RoomMemberListItemOutput]),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async approveMember(
    @ReqContext() ctx: RequestContext,
    @Body() input: ApproveMembersInput,
  ): Promise<BaseApiResponse<RoomMemberListItemOutput[]>> {
    this.logger.log(ctx, `${this.approveMember.name} was called`);
    const member = await this.memberInRoomService.approveMember(ctx, input);
    return {
      data: member,
      meta: {},
    };
  }

  @Post('/cancel-invitation')
  @ApiOperation({
    summary: 'cancel invitation of a member in room',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(RoomMemberListItemOutput),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async cancelInvitation(
    @ReqContext() ctx: RequestContext,
    @Body() input: CancelInviteMemberInput,
  ): Promise<BaseApiResponse<RoomMemberListItemOutput>> {
    this.logger.log(ctx, `${this.approveMember.name} was called`);
    const member = await this.memberInRoomService.cancelInviteMember(
      ctx,
      input,
    );
    return {
      data: member,
      meta: {},
    };
  }

  @Post('/update-last-time-viewed/:roomId')
  @ApiOperation({
    summary: 'update last time user viewed room',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(RoomMemberListItemOutput),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async updateLastTimeViewed(
    @ReqContext() ctx: RequestContext,
    @Param('roomId') roomId: number,
  ): Promise<BaseApiResponse<RoomMemberListItemOutput>> {
    this.logger.log(ctx, `${this.updateLastTimeViewed.name} was called`);
    const member = await this.memberInRoomService.updateLastTimeViewed(
      ctx,
      roomId,
    );
    return {
      data: member,
      meta: {},
    };
  }

  @Post('edit-role')
  @ApiOperation({
    summary: 'edit role of member',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([RoomMemberListItemOutput]),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async editRole(
    @ReqContext() ctx: RequestContext,
    @Body() input: EditMemberRoleInput,
  ): Promise<BaseApiResponse<RoomMemberListItemOutput[]>> {
    this.logger.log(ctx, `${this.editRole.name} was called`);
    const member = await this.memberInRoomService.editMemberRole(ctx, input);
    return {
      data: member,
      meta: {},
    };
  }

  @Post('can-do-action')
  @ApiOperation({
    summary: 'Check if user can do action ',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(Boolean),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async checkCanDoAction(
    @ReqContext() ctx: RequestContext,
    @Body() input: CanDoActionInput,
  ): Promise<BaseApiResponse<boolean>> {
    this.logger.log(ctx, `${this.editRole.name} was called`);
    const canDoAction = await this.memberInRoomService.checkCanDoAction(
      ctx,
      input,
    );
    return {
      data: canDoAction,
      meta: {},
    };
  }
}
