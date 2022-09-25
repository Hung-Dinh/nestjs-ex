import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
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
import { ReqContext } from 'src/shared/request-context/req-context.decorator';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { UPLOAD_STRATEGY_NAME } from '../constants/file.constant';
import { UploadedFileOutput } from '../dtos/upload-file-output.dto';
import { UploadedFilesOutput } from '../dtos/upload-files-output.dto';
import { FileService } from '../services/file.service';

@ApiTags('file')
@Controller('file')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard)
export class FileController {
  constructor(private fileService: FileService) {}

  @Post('/upload-image')
  @ApiOperation({
    summary: 'upload image',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(UploadedFileOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @ReqContext() ctx: RequestContext,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BaseApiResponse<UploadedFileOutput>> {
    const fileId = await this.fileService.createFile(ctx, file);
    return {
      data: {
        fileId,
      },
      meta: {},
    };
  }

  @Post('/upload-multi-images')
  @ApiOperation({
    summary: 'upload multi images',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(UploadedFilesOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMultiImages(
    @ReqContext() ctx: RequestContext,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<BaseApiResponse<UploadedFilesOutput>> {
    const fileIds = await this.fileService.createFiles(ctx, files);
    return {
      data: {
        fileIds,
      },
      meta: {},
    };
  }

  @Post('/upload-file')
  @ApiOperation({
    summary: 'upload file to ipfs',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(UploadedFileOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileToIpfs(
    @ReqContext() ctx: RequestContext,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BaseApiResponse<UploadedFileOutput>> {
    const fileId = await this.fileService.createFile(
      ctx,
      file,
      '',
      UPLOAD_STRATEGY_NAME.IPFS,
    );
    return {
      data: {
        fileId,
      },
      meta: {},
    };
  }

  @Post('/upload-multi-files')
  @ApiOperation({
    summary: 'upload multi files to ipfs',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(UploadedFilesOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMultiFileToIpfs(
    @ReqContext() ctx: RequestContext,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<BaseApiResponse<UploadedFilesOutput>> {
    const fileIds = await this.fileService.createFiles(
      ctx,
      files,
      '',
      UPLOAD_STRATEGY_NAME.IPFS,
    );
    return {
      data: {
        fileIds,
      },
      meta: {},
    };
  }

  @Post('/decrypt-file')
  @ApiOperation({
    summary: 'get file by id',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([String]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async decryptFile(
    @ReqContext() ctx: RequestContext,
    @Body()
    input: {
      ipfsUrl: string;
      chatRoomId: number;
    },
  ): Promise<BaseApiResponse<string>> {
    const url = await this.fileService.decryptFile(
      ctx,
      input.ipfsUrl,
      input.chatRoomId,
    );

    return {
      data: url,
      meta: {},
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'get file by id',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([String]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getFileById(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<BaseApiResponse<string>> {
    const url = await this.fileService.getFileUrl(id);

    return {
      data: url,
      meta: {},
    };
  }
}
