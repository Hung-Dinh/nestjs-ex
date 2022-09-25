import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Param,
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
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { ROLE } from '../../auth/constants/role.constant';
import { Roles } from '../../auth/decorators/role.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from '../../shared/dtos/base-api-response.dto';
import { PaginationParamsDto } from '../../shared/dtos/pagination-params.dto';
import { AppLogger } from '../../shared/logger/logger.service';
import { ReqContext } from '../../shared/request-context/req-context.decorator';
import { NetworkFeesOutput } from '../dtos/network-fee-output';
import { NetworkOutput } from '../dtos/network-output.dto';
import { NetworkService } from '../services/network.service';

@ApiTags('networks')
@Controller('networks')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard)
export class NetworkController {
  constructor(
    private readonly networkService: NetworkService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(NetworkController.name);
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({
    summary: 'Get network list',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([NetworkOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiBearerAuth()
  async getNetworks(
    @ReqContext() ctx: RequestContext,
    @Query() query: PaginationParamsDto,
  ): Promise<BaseApiResponse<NetworkOutput[]>> {
    this.logger.log(ctx, `${this.getNetworks.name} was called`);

    const { networkList, count } = await this.networkService.getNetworks(
      ctx,
      query.offset,
      query.limit,
    );

    return { data: networkList, meta: { count } };
  }

  @Get('/:id/fees')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({
    summary: 'Get network list',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([NetworkFeesOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiBearerAuth()
  async getNetworkFees(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<BaseApiResponse<NetworkFeesOutput[]>> {
    this.logger.log(ctx, `${this.getNetworkFees.name} was called`);

    const networkFees = await this.networkService.getNetworkFees(ctx, id);
    return { data: networkFees, meta: {} };
  }
}
