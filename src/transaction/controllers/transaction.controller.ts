import {
  Body,
  ClassSerializerInterceptor,
  Controller,
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

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from '../../shared/dtos/base-api-response.dto';
import { PaginationParamsDto } from '../../shared/dtos/pagination-params.dto';
import { AppLogger } from '../../shared/logger/logger.service';
import { ReqContext } from '../../shared/request-context/req-context.decorator';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { GetTokenTransactionDto } from '../dtos/get-token-transactions.dto';
import { GetMessageTransactionHistoryParamsDto } from '../dtos/get-trans-mess-history.dto';
import { HistoryDetailOutput } from '../dtos/history-detail-output.dto';
import { HistoryDetailParamsDto } from '../dtos/history-detail-param.dto';
import { HistoryListOutput } from '../dtos/history-list-output.dto';
import { RecentTransactionParamsDto } from '../dtos/recent-transaction-input.dto';
import { RecentTransactionOutput } from '../dtos/recent-transaction-output.dto';
import { SendTokenInput } from '../dtos/send-token-input.dto';
import { TransactionOutput } from '../dtos/transaction-output.dto';
import { TransactionService } from '../services/transaction.service';

@ApiTags('transactions')
@Controller('transactions')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard)
export class TransactionController {
  constructor(
    private transactionService: TransactionService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(TransactionController.name);
  }

  @Get('/list/:walletId')
  @ApiOperation({
    summary: 'get user wallet transaction list API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([TransactionOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getMyTransactionList(
    @ReqContext() ctx: RequestContext,
    @Param('walletId') walletId: number,
    @Query() query: PaginationParamsDto,
  ): Promise<BaseApiResponse<TransactionOutput[]>> {
    this.logger.log(ctx, `${this.getMyTransactionList.name} was called`);

    const { transactions, count } =
      await this.transactionService.getTransactionsByUserWallet(
        ctx,
        walletId,
        query.limit,
        query.offset,
      );
    return {
      data: transactions,
      meta: {
        count,
      },
    };
  }

  @Post('send-token')
  @ApiOperation({
    summary: 'send token API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([TransactionOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async sendToken(
    @ReqContext() ctx: RequestContext,
    @Body() input: SendTokenInput,
  ): Promise<BaseApiResponse<TransactionOutput>> {
    this.logger.log(ctx, `${this.sendToken.name} was called`);

    const newSendTokenTransaction =
      await this.transactionService.sendTokenTransaction(
        ctx,
        ctx.user.id,
        input,
      );
    return { data: newSendTokenTransaction, meta: {} };
  }

  @Get('/recent')
  @ApiOperation({
    summary: 'get user recent sent transaction receivers API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([TransactionOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getRecentSentTransactionReceivers(
    @ReqContext() ctx: RequestContext,
    @Query() query: RecentTransactionParamsDto,
  ): Promise<BaseApiResponse<RecentTransactionOutput[]>> {
    this.logger.log(
      ctx,
      `${this.getRecentSentTransactionReceivers.name} was called`,
    );

    const recentTransactionReceivers =
      await this.transactionService.getRecentSentTransactionReceivers(
        ctx,
        ctx.user.id,
        query.networkId,
      );
    return {
      data: recentTransactionReceivers,
      meta: {},
    };
  }

  @Get('token-transactions')
  @ApiOperation({
    summary: 'get token transactions API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([TransactionOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getTokenTransactions(
    @ReqContext() ctx: RequestContext,
    @Query() query: GetTokenTransactionDto,
  ): Promise<BaseApiResponse<any>> {
    const { transactions, count } =
      await this.transactionService.getTokenTransactions(ctx, query);

    return {
      data: transactions,
      meta: {
        count,
      },
    };
  }

  @Get('history-trans-and-mess')
  @ApiOperation({
    summary: 'get  transactions API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([HistoryListOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getTransactionAndMessageHistory(
    @ReqContext() ctx: RequestContext,
    @Query() query: GetMessageTransactionHistoryParamsDto,
  ): Promise<BaseApiResponse<HistoryListOutput[]>> {
    const histories =
      await this.transactionService.getMesssageAndTransactionHistory(
        ctx,
        ctx.user.id,
        query.networkId,
        query.limit,
        query.offset,
      );

    return {
      data: histories,
      meta: {},
    };
  }

  @Get('detail-history')
  @ApiOperation({
    summary: 'get detail transactions and message',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(HistoryDetailOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getDetailTransactionAndMessageHistory(
    @ReqContext() ctx: RequestContext,
    @Query() query: HistoryDetailParamsDto,
  ): Promise<BaseApiResponse<HistoryDetailOutput>> {
    const historyDetail =
      await this.transactionService.getDetailMesssageAndTransactionHistory(
        ctx,
        ctx.user.id,
        query.refId,
        query.type,
        query.title,
      );

    return {
      data: historyDetail,
      meta: {},
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'get transaction by id',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(HistoryDetailOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getTransactionById(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<BaseApiResponse<TransactionOutput>> {
    const transaction = await this.transactionService.getTransactionById(
      ctx,
      id,
    );
    return {
      data: transaction,
      meta: {},
    };
  }
}
