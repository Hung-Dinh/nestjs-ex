import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
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

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from '../../shared/dtos/base-api-response.dto';
import { AppLogger } from '../../shared/logger/logger.service';
import { ReqContext } from '../../shared/request-context/req-context.decorator';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { DeviceOutput } from '../dtos/device-output.dto';
import { UpdateUserDeviceInput } from '../dtos/update-user-device-input.dto';
import { DeviceService } from '../services/device.service';

@ApiTags('device')
@Controller('device')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard)
export class DeviceController {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(DeviceController.name);
  }

  @Post('/update')
  @ApiOperation({
    summary: 'User login API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(DeviceOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async updateUserDeviced(
    @ReqContext() ctx: RequestContext,
    @Body() input: UpdateUserDeviceInput,
  ): Promise<BaseApiResponse<DeviceOutput>> {
    this.logger.log(ctx, `${this.updateUserDeviced.name} was called`);

    const device = await this.deviceService.updateDevice(
      ctx,
      ctx.user.id,
      input,
    );
    return { data: device, meta: {} };
  }
}
