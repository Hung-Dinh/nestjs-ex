import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
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

import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from '../../shared/dtos/base-api-response.dto';
import { AppLogger } from '../../shared/logger/logger.service';
import { ReqContext } from '../../shared/request-context/req-context.decorator';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { AUTH_HEADER } from '../constants/strategy.constant';
import { LoginInput } from '../dtos/auth-login-input.dto';
import { RefreshTokenInput } from '../dtos/auth-refresh-token-input.dto';
import { RegisterInput } from '../dtos/auth-register-input.dto';
import { RegisterOutput } from '../dtos/auth-register-output.dto';
import { AuthTokenOutput } from '../dtos/auth-token-output.dto';
import { ImportWalletOutput } from '../dtos/import-wallet-output.dto';
import { RecoverOutput } from '../dtos/recover-output.dto';
import { RecoverPrivateKeyInput } from '../dtos/recover-private-key-input.dto';
import { RecoverSeedPhraseInput } from '../dtos/recover-seed-phrase-input.dto';
import { AuthHeaderApiKeyGuard } from '../guards/auth-header-api-key.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthService } from '../services/auth.service';

@ApiTags('auth')
@Controller('auth')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthController.name);
  }
  @Post('login')
  @ApiOperation({
    summary: 'User login API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(AuthTokenOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthHeaderApiKeyGuard, LocalAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  login(
    @ReqContext() ctx: RequestContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() credential: LoginInput,
  ): BaseApiResponse<AuthTokenOutput> {
    this.logger.log(ctx, `${this.login.name} was called`);

    const authToken = this.authService.login(ctx);
    return { data: authToken, meta: {} };
  }

  @Post('register')
  @ApiOperation({
    summary: 'User registration API',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: SwaggerBaseApiResponse(RegisterOutput),
  })
  @UseGuards(AuthHeaderApiKeyGuard)
  async registerLocal(
    @ReqContext() ctx: RequestContext,
    @Body() input: RegisterInput,
  ): Promise<BaseApiResponse<RegisterOutput>> {
    const registeredUser = await this.authService.register(ctx, input);
    return { data: registeredUser, meta: {} };
  }

  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh access token API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(AuthTokenOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async refreshToken(
    @ReqContext() ctx: RequestContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() credential: RefreshTokenInput,
  ): Promise<BaseApiResponse<AuthTokenOutput>> {
    this.logger.log(ctx, `${this.refreshToken.name} was called`);

    const authToken = await this.authService.refreshToken(ctx, credential);
    return { data: authToken, meta: {} };
  }

  @Post('recover/seed-phrase')
  @ApiOperation({
    summary: 'User recover using seed phrase API',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: SwaggerBaseApiResponse(RecoverOutput),
  })
  @UseGuards(AuthHeaderApiKeyGuard)
  async recoverBySeedPhrase(
    @ReqContext() ctx: RequestContext,
    @Body() input: RecoverSeedPhraseInput,
  ): Promise<BaseApiResponse<RecoverOutput>> {
    const response = await this.authService.verifySeedPhrase(ctx, input);
    return { data: response, meta: {} };
  }

  @Post('recover/private-key')
  @ApiOperation({
    summary: 'User recover using private key API',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: SwaggerBaseApiResponse(RecoverOutput),
  })
  @UseGuards(AuthHeaderApiKeyGuard)
  async recoverByPrivateKey(
    @ReqContext() ctx: RequestContext,
    @Body() input: RecoverPrivateKeyInput,
  ): Promise<BaseApiResponse<RecoverOutput>> {
    const response = await this.authService.verifyPrivateKey(ctx, input);
    return { data: response, meta: {} };
  }

  @Post('import/seed-phrase')
  @ApiOperation({
    summary: 'User import using seed phrase API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(ImportWalletOutput),
  })
  @UseGuards(AuthHeaderApiKeyGuard)
  async importBySeedPhrase(
    @ReqContext() ctx: RequestContext,
    @Body() input: RecoverSeedPhraseInput,
  ): Promise<BaseApiResponse<ImportWalletOutput>> {
    const response = await this.authService.importWalletFromSeedPhrase(ctx, input.seedPhrase, 1);
    return { data: response, meta: {} };
  }

  @Post('import/private-key')
  @ApiOperation({
    summary: 'User import using private key API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(ImportWalletOutput),
  })
  @UseGuards(AuthHeaderApiKeyGuard)
  async importByPrivateKey(
    @ReqContext() ctx: RequestContext,
    @Body() input: RecoverPrivateKeyInput,
  ): Promise<BaseApiResponse<ImportWalletOutput>> {
    const response = await this.authService.importWalletFromPrivateKey(ctx, input.privateKey);
    return { data: response, meta: {} };
  }
}