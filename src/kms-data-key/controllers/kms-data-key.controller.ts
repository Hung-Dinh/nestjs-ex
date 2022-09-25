import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpStatus,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from 'src/shared/dtos/base-api-response.dto';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { TestKmsInput } from '../dtos/test-kms-input.dto';
import { KmsDataKeyService } from '../services/kms-data-key.service';

@Controller('kms')
export class KmsDataKeyController {
  constructor(private readonly kmsDataKeyService: KmsDataKeyService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('encrypt')
  @ApiOperation({
    summary: 'Encrypt text',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(String),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  async encrypt(
    ctx: RequestContext,
    @Body() input: TestKmsInput,
  ): Promise<BaseApiResponse<string>> {
    const encryptedText = await this.kmsDataKeyService.encryptWithRandomDataKey(
      input.text,
    );

    return {
      data: encryptedText,
      meta: {},
    };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('decrypt')
  @ApiOperation({
    summary: 'Decrypt text',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(String),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  async decrypt(
    ctx: RequestContext,
    @Body() input: TestKmsInput,
  ): Promise<BaseApiResponse<string>> {
    const encryptedText = await this.kmsDataKeyService.decryptWithRandomDatakey(
      input.text,
    );

    return {
      data: encryptedText,
      meta: {},
    };
  }

  @Post('generate-data-key')
  @ApiOperation({
    summary: 'Generate data key',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(String),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  async generateDataKey(): Promise<BaseApiResponse<string>> {
    const dataKey = await this.kmsDataKeyService.generateOrGetDataKey();
    return {
      data: !!dataKey ? 'success' : 'fail',
      meta: {},
    };
  }
}
