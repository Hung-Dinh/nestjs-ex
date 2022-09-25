import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Post,
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
import { PaginationParamsDto } from 'src/shared/dtos/pagination-params.dto';
import { ReqContext } from 'src/shared/request-context/req-context.decorator';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { BlockInput } from '../dtos/block-unblock-input.dto';
import { UnblockInput } from '../dtos/unblock-input.dto';
import { BlockedUserOutput } from '../dtos/user-block-list-output.dto';
import { UserBlockService } from '../services/user-block.service';

@ApiTags('user-block')
@Controller('user-block')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard)
export class UserBlockController {
  constructor(private readonly userBlockService: UserBlockService) {}

  @Get('list')
  @ApiOperation({
    summary: 'get users who blocked by current user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([BlockedUserOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getUserBlockedList(
    @ReqContext() ctx: RequestContext,
    @Query() query: PaginationParamsDto,
  ): Promise<BaseApiResponse<BlockedUserOutput[]>> {
    const { data, count } = await this.userBlockService.getUserBlockedList(
      ctx,
      ctx.user.id,
      query.offset,
      query.limit,
    );
    return {
      data,
      meta: {
        count,
      },
    };
  }

  @Post('block')
  @ApiOperation({
    summary: 'block a user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(Boolean),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async blockUser(
    @ReqContext() ctx: RequestContext,
    @Body() input: BlockInput,
  ): Promise<BaseApiResponse<boolean>> {
    const response = await this.userBlockService.blockUser(ctx, input);
    return {
      data: response,
      meta: {},
    };
  }
  @Post('unblock')
  @ApiOperation({
    summary: 'unblock a user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(Boolean),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async unBlockUser(
    @ReqContext() ctx: RequestContext,
    @Body() input: UnblockInput,
  ): Promise<BaseApiResponse<boolean>> {
    const response = await this.userBlockService.unBlockUser(ctx, input);
    return {
      data: response,
      meta: {},
    };
  }
}
