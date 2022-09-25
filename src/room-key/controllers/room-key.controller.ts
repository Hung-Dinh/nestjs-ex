import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Param,
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

import { RoomKeyOutput } from '../dtos/room-key-output.dto';
import { RoomKeyService } from '../services/room-key.service';

@ApiTags('room_key')
@Controller('room_key')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard, ChatNetworkGuard)
export class RoomKeyController {
  constructor(
    private readonly roomKeyService: RoomKeyService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RoomKeyController.name);
  }

  @Get('/:roomId')
  @ApiOperation({
    summary: 'Get user me API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(RoomKeyOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getRoomKey(
    @ReqContext() ctx: RequestContext,
    @Param('roomId') roomId: number,
  ): Promise<BaseApiResponse<RoomKeyOutput>> {
    this.logger.log(ctx, `${this.getRoomKey.name} was called`);

    const roomKey = await this.roomKeyService.getRoomKey(ctx, roomId);

    return {
      data: roomKey,
      meta: {},
    };
  }
}
