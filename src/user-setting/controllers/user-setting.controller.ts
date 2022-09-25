import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
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
import { AppLogger } from 'src/shared/logger/logger.service';
import { ReqContext } from 'src/shared/request-context/req-context.decorator';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { AddUserSettingInput } from '../dtos/user-add-setting-input.dto';
import { UserSettingOutput } from '../dtos/user-setting-output.dto';
import { UserSettingService } from '../services/user-setting.service';

@ApiTags('user-setting')
@Controller('user-setting')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard)
export class UserSettingController {
  constructor(
    private readonly userSettingService: UserSettingService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserSettingController.name);
  }


  @Post('add-update')
  @ApiOperation({
    summary: 'user add contact API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(UserSettingOutput),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async upsertSetting(
    @ReqContext() ctx: RequestContext,
    @Body() input: AddUserSettingInput,
  ): Promise<BaseApiResponse<UserSettingOutput>> {
    this.logger.log(ctx, `${this.upsertSetting.name} was called`);
    const userSetting = await this.userSettingService.upsertSetting(
      ctx,
      ctx.user.id, 
      input);
    return { data: userSetting, meta: {} };
  }

  
  

  @Get('/detail')
  @ApiOperation({
    summary: 'get user contact detail by id API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(UserSettingOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getSettingDetail(
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<UserSettingOutput>> {
    this.logger.log(ctx, `${this.getSettingDetail.name} was called`);
    const detailSetting = await this.userSettingService.getSettingDetail(ctx, ctx.user.id);
    return { data: detailSetting, meta: {} };
  }

}
