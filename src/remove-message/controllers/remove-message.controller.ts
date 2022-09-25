import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpStatus,
  Post,
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

import { AddRemoveMessageInput } from '../dtos/add-remove-message-input.dto';
import { RemoveMessageOutput } from '../dtos/remove-message-output.dto';
import { RemoveMessageService } from '../services/remove-message.service';

@ApiTags('remove-message')
@Controller('remove-message')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard, ChatNetworkGuard)
export class RemoveMessageController {
  constructor(
    private readonly removeMessageService: RemoveMessageService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RemoveMessageController.name);
  }

  @Post('remove')
  @ApiOperation({
    summary: 'user remove message for him/her API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(RemoveMessageOutput),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async addNewRemoveMessage(
    @ReqContext() ctx: RequestContext,
    @Body() input: AddRemoveMessageInput,
  ): Promise<BaseApiResponse<RemoveMessageOutput>> {
    this.logger.log(ctx, `${this.addNewRemoveMessage.name} was called`);
    const removeMessage = await this.removeMessageService.addRemoveMessage(
      ctx,
      ctx.user.id,
      input,
    );
    return { data: removeMessage, meta: {} };
  }
}
