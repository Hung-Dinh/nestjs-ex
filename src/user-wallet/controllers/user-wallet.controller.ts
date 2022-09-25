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
import { AppLogger } from 'src/shared/logger/logger.service';
import { ReqContext } from 'src/shared/request-context/req-context.decorator';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { ChangeNetworkInput } from '../dtos/change-network-input.dto';
import { CheckAddressInput } from '../dtos/check-address-input.dto';
import { CheckSufficientFundOutput } from '../dtos/check-sufficient-funds-output.dto';
import { GetBalanceInput } from '../dtos/get-balance-input.dto';
import { GetBalanceOutput } from '../dtos/get-balance-output.dto';
import { UserWalletOutput } from '../dtos/user-wallet-output.dto';
import { UserWalletService } from '../services/user-wallet.service';

@ApiTags('user-wallet')
@Controller('user-wallet')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard)
export class UserWallletController {
  constructor(
    private readonly userWalletService: UserWalletService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserWallletController.name);
  }

  @Get('me')
  @ApiOperation({
    summary: 'get my wallets API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([UserWalletOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getMyWallet(
    @ReqContext() ctx: RequestContext,
    @Query() query: PaginationParamsDto,
  ): Promise<BaseApiResponse<UserWalletOutput[]>> {
    const { wallets, count } = await this.userWalletService.getUserWallets(
      ctx,
      ctx.user.id,
      query.offset,
      query.limit,
    );

    return {
      data: wallets,
      meta: {
        count,
      },
    };
  }

  @Post('change-network')
  @ApiOperation({
    summary: 'change network API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(UserWalletOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async changeNetwork(
    @ReqContext() ctx: RequestContext,
    @Body() input: ChangeNetworkInput,
  ): Promise<BaseApiResponse<UserWalletOutput>> {
    const result = await this.userWalletService.changeNetwork(
      ctx,
      ctx.user.id,
      input,
    );

    return {
      data: result,
      meta: {},
    };
  }

  @Post('get-balance')
  @ApiOperation({
    summary: 'get balance API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(GetBalanceOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getBalance(
    @ReqContext() ctx: RequestContext,
    @Body() input: GetBalanceInput,
  ): Promise<BaseApiResponse<GetBalanceOutput[]>> {
    const result = await this.userWalletService.getBalance(
      ctx,
      ctx.user.id,
      input,
    );

    return {
      data: result,
      meta: {},
    };
  }

  @Post('check-address')
  @ApiOperation({
    summary: 'check a address in user-wallets or not',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async checkAddress(
    @ReqContext() ctx: RequestContext,
    @Body() input: CheckAddressInput,
  ): Promise<BaseApiResponse<boolean>> {
    const checkInternalAddress = await this.userWalletService.checkAddress(
      ctx,
      input.address,
    );
    return { data: checkInternalAddress, meta: {} };
  }

  @Post('check-address-invalid')
  @ApiOperation({
    summary: 'check a address is valid or not and in user-wallets or not',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async checkAddressInvalid(
    @ReqContext() ctx: RequestContext,
    @Body() input: CheckAddressInput,
  ): Promise<BaseApiResponse<any>> {
    const checkValidAddress = await this.userWalletService.checkAddressInvalid(
      ctx,
      input,
    );
    return { data: checkValidAddress, meta: {} };
  }

  @Post('check-sufficient-fund')
  @ApiOperation({
    summary: 'Check if sufficient funds to send transaction',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(CheckSufficientFundOutput),
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async checkSufficientFunds(
    @ReqContext() ctx: RequestContext,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    @Body() input: any,
  ): Promise<BaseApiResponse<CheckSufficientFundOutput>> {
    this.logger.log(ctx, `${this.checkSufficientFunds.name} was called`);

    const sufficientFunds = await this.userWalletService.checkSufficientFund(
      ctx,
      input.type,
      input.networkId,
      ctx.user.id,
      input.data,
    );

    return {
      data: sufficientFunds,
      meta: {},
    };
  }
}
