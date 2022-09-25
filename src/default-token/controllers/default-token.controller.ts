import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
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
import { AppLogger } from 'src/shared/logger/logger.service';
import { ReqContext } from 'src/shared/request-context/req-context.decorator';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { DefaultTokenOutput } from '../dtos/default-token-output.dto';
import { DefaultTokenService } from '../services/default-token.service';

@ApiTags('default-token')
@Controller('default-token')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard)
export class DefaultTokenController {
  constructor(
    private readonly defaultTokenService: DefaultTokenService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(DefaultTokenController.name);
  }

  @Get('/list')
  @ApiOperation({
    summary: 'Get default token list API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([DefaultTokenOutput]),
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
    @Query() query: PaginationParamsDto,
  ): Promise<BaseApiResponse<DefaultTokenOutput[]>> {
    this.logger.log(ctx, `${this.getMyTokenList.name} was called`);

    const { tokens, count } =
      await this.defaultTokenService.getDefaultTokenList(
        ctx,
        query.limit,
        query.offset,
      );
    return {
      data: tokens,
      meta: {
        count,
      },
    };
  }
}
