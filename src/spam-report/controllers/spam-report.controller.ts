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

import { AddSpamReportInput } from '../dtos/add-spam-report--input.dto';
import { SpamReportOutput } from '../dtos/spam-report-output.dto';
import { SpamReportService } from '../services/spam-report.service';

@ApiTags('spam-report')
@Controller('spam-report')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard, ChatNetworkGuard)
export class SpamReportController {
  constructor(
    private readonly spamReportService: SpamReportService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SpamReportController.name);
  }

  @Post('add')
  @ApiOperation({
    summary: 'user add new spam report API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(SpamReportOutput),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async addNewSpamReport(
    @ReqContext() ctx: RequestContext,
    @Body() input: AddSpamReportInput,
  ): Promise<BaseApiResponse<SpamReportOutput>> {
    this.logger.log(ctx, `${this.addNewSpamReport.name} was called`);
    const spamReport = await this.spamReportService.addSpamReport(
      ctx,
      ctx.user.id,
      input,
    );
    return { data: spamReport, meta: {} };
  }
}
