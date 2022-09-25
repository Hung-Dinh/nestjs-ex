import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
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
import { AppLogger } from 'src/shared/logger/logger.service';
import { ReqContext } from 'src/shared/request-context/req-context.decorator';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { CalcAmountInUSDInput } from '../dtos/get-price-in-usd-input.dto';
import { ListMeParamsDto } from '../dtos/list-me-param.dto';
import { AddUserTokenInput } from '../dtos/user-add-token-input.dto';
import { UserTokenOutput } from '../dtos/user-token-output.dto';
import { UserTokenService } from '../services/user-token.service';

@ApiTags('user-token')
@Controller('user-token')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard)
export class UserTokenController {
  constructor(
    private readonly userTokenService: UserTokenService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserTokenController.name);
  }

  @Get('/list/me')
  @ApiOperation({
    summary: 'Get user token list API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([UserTokenOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getMyTokenList(
    @ReqContext() ctx: RequestContext,
    @Query() query: ListMeParamsDto,
  ): Promise<BaseApiResponse<UserTokenOutput[]>> {
    this.logger.log(ctx, `${this.getMyTokenList.name} was called`);

    const { tokens, count } = await this.userTokenService.getUserTokenList(
      ctx,
      ctx.user.id,
      query.offset,
      query.limit,
      query.networkId,
    );
    return {
      data: tokens,
      meta: {
        count,
      },
    };
  }

  @Post('add')
  @ApiOperation({
    summary: 'user add token API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(UserTokenOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async addToken(
    @ReqContext() ctx: RequestContext,
    @Body() input: AddUserTokenInput,
  ): Promise<BaseApiResponse<UserTokenOutput>> {
    this.logger.log(ctx, `${this.addToken.name} was called`);
    const newUserToken = await this.userTokenService.addToken(ctx, input);
    return { data: newUserToken, meta: {} };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'user remove token by id API',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async removeToken(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<void> {
    this.logger.log(ctx, `${this.removeToken.name} was called`);
    return this.userTokenService.removeTokenById(ctx, id);
  }

  @Post('calc-amount-in-usd')
  @ApiOperation({
    summary: 'calculate amount in USD API',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async calcAmountInUSD(
    @ReqContext() ctx: RequestContext,
    @Body() input: CalcAmountInUSDInput,
  ): Promise<BaseApiResponse<number>> {
    const coinPriceInUSD = await this.userTokenService.calcAmountInUSD(
      ctx,
      input,
    );
    return { data: coinPriceInUSD, meta: {} };
  }
}
