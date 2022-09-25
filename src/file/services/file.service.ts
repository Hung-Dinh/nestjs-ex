import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { CryptoService } from 'src/crypto/services/crypto.module';
import { RoomKeyService } from 'src/room-key/services/room-key.service';
import { UPLOAD_STRATEGY } from 'src/shared/configs/secret';
import { TFileInfo } from 'src/shared/dtos/file-message-info.dto';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { NumberTool } from 'src/shared/tools/number.tool';
import { IpfsUploadService } from 'src/upload/services/ipfs.service';
import { LocalUploadService } from 'src/upload/services/local.service';
import { S3UploadService } from 'src/upload/services/s3.service';
import { Connection } from 'typeorm';

import { UPLOAD_STRATEGY_NAME } from '../constants/file.constant';
import { File } from '../entities/file.entity';
import { FileRepository } from '../repositories/file.repository';

@Injectable()
export class FileService {
  constructor(
    private readonly logger: AppLogger,
    private readonly connection: Connection,
    private readonly cryptoService: CryptoService,
    private readonly fileRepository: FileRepository,
    private readonly roomKeyService: RoomKeyService,
    private readonly s3UploadService: S3UploadService,
    private readonly ipfsUploadService: IpfsUploadService,
    private readonly localUploadService: LocalUploadService,
  ) {}

  async getById(id: number): Promise<File> {
    const file = await this.fileRepository.findOne(id);
    return file;
  }

  private async constructS3File(
    userId: number,
    file: Express.Multer.File,
    path = '',
  ): Promise<File> {
    const response = await this.s3UploadService.uploadFile(
      file,
      'private',
      path,
    );

    const newFile = {
      ownerId: userId,
      type: file.mimetype,
      path: response.Location,
      driver: UPLOAD_STRATEGY_NAME.S3,
      s3key: response.Key,
      bucket: response.Bucket,
    };

    return plainToClass(File, newFile);
  }

  private async constructLocalFile(
    userId: number,
    file: Express.Multer.File,
    path = '',
  ): Promise<File> {
    const localPath = await this.localUploadService.uploadImage(file, path);
    const newFile = {
      ownerId: userId,
      type: file.mimetype,
      path: localPath,
      driver: UPLOAD_STRATEGY || UPLOAD_STRATEGY_NAME.LOCAL,
      s3key: '',
      bucket: '',
    };

    return plainToClass(File, newFile);
  }

  private async constructIpfsFile(
    userId: number,
    file: Express.Multer.File,
  ): Promise<File> {
    const ipfsFile = await this.ipfsUploadService.addFile({
      path: file.filename,
      content: file.buffer,
    });
    return plainToClass(File, {
      ownerId: userId,
      type: file.mimetype,
      path: ipfsFile.path,
      driver: 'ipfs',
      s3key: '',
      bucket: '',
    });
  }

  private async constructFile(
    userId: number,
    file: Express.Multer.File,
    path = '',
    uploadStrategy = UPLOAD_STRATEGY,
  ): Promise<File> {
    switch (uploadStrategy) {
      case UPLOAD_STRATEGY_NAME.LOCAL:
        return this.constructLocalFile(userId, file, path);
      case UPLOAD_STRATEGY_NAME.S3:
        return this.constructS3File(userId, file, path);
      case UPLOAD_STRATEGY_NAME.IPFS:
        return this.constructIpfsFile(userId, file);
      default: {
        throw new Error('File upload failed');
      }
    }
  }

  async createFile(
    ctx: RequestContext,
    file: Express.Multer.File,
    path = '',
    uploadStrategy = UPLOAD_STRATEGY,
  ): Promise<number> {
    this.logger.log(ctx, `${this.createFile.name} was called`);

    const newFile = await this.constructFile(
      ctx.user.id,
      file,
      path,
      uploadStrategy,
    );

    const newDbFile = await this.fileRepository.save({
      ...newFile,
      filename: file.filename || file.originalname,
      filesize: file.size,
      filetype: file.mimetype,
    });

    return newDbFile.id;
  }

  async createFiles(
    ctx: RequestContext,
    files: Express.Multer.File[],
    path = '',
    uploadStrategy = UPLOAD_STRATEGY,
  ): Promise<number[]> {
    this.logger.log(ctx, `${this.createFiles.name} was called`);

    const newFiles: File[] = await Promise.all(
      files.map(async (file) => {
        return this.constructFile(ctx.user.id, file, path, uploadStrategy);
      }),
    );

    const newDbFiles = await this.connection.transaction(async (manager) => {
      const response = await manager.save(newFiles);
      return response;
    });

    return newDbFiles.map((file) => file.id);
  }

  async getFileUrl(id: number): Promise<string> {
    const file = await this.getById(id);
    if (!file) {
      throw new BadRequestException('File not found');
    }

    switch (file.driver) {
      case UPLOAD_STRATEGY_NAME.LOCAL:
        return file.path;
      case UPLOAD_STRATEGY_NAME.S3:
        return this.s3UploadService.getS3SignedUrl({
          bucket: file.bucket,
          s3key: file.s3key,
          fileType: file.type,
        });
      case UPLOAD_STRATEGY_NAME.IPFS:
        let ipfsPath = file.ipfsPath;
        if (ipfsPath.includes('_')) {
          ipfsPath = ipfsPath.split('_')[0];
        }
        return this.ipfsUploadService.getFileUrl(ipfsPath);
      default:
        return file.path;
    }
  }

  async getFileUrls(ids: string[]): Promise<{
    [key: string]: string;
  }> {
    const uniqueIds = Array.from(
      new Set(ids.filter((id) => id && NumberTool.isStringNumber(id))),
    );
    const files = await Promise.all(
      uniqueIds.map(async (id: string) => {
        return {
          [id]: await this.getFileUrl(+id),
        };
      }),
    );

    return files.reduce((acc, cur) => {
      return {
        ...acc,
        ...cur,
      };
    }, {});
  }

  async getFileInfoByIpfsUrl(ipfsUrl: string): Promise<TFileInfo> {
    const ipfsPath = this.ipfsUploadService.getFilePathFromUrl(ipfsUrl);
    const file = await this.fileRepository.findOne({
      where: {
        ipfsPath,
      },
      select: ['id', 'fileInfo'],
    });

    if (!file) {
      console.error(`File not found for ipfs path: ${ipfsPath}`);
      return {
        url: ipfsPath,
        fileInfo: '',
      };
    }
    const url = await this.getFileUrl(file.id);

    return {
      url,
      fileInfo: file.fileInfo,
    };
  }

  async getFileInfoByFileId(fileId: number): Promise<TFileInfo> {
    const file = await this.fileRepository.findOne(fileId, {
      select: ['fileInfo'],
    });
    if (!file) {
      console.error(`File not found for id ${fileId}`);
      return {
        url: '',
        fileInfo: '',
      };
    }

    return {
      url: '',
      fileInfo: file.fileInfo,
    };
  }

  async decryptFile(
    ctx: RequestContext,
    ipfsUrl: string,
    chatRoomId: number,
  ): Promise<any> {
    let ipfsPath = this.ipfsUploadService.getFilePathFromUrl(ipfsUrl);
    const file = await this.fileRepository.findOne({
      where: {
        ipfsPath,
      },
    });

    if (ipfsPath.includes('_')) {
      ipfsPath = ipfsPath.split('_')[0];
    }

    const temp = await this.ipfsUploadService.getFile(ipfsPath);

    let content = [];
    for await (const chunk of temp) {
      content = [...content, ...chunk];
    }

    const roomKey = await this.roomKeyService.getRoomKey(ctx, chatRoomId);
    const buffer = Buffer.from(content);
    const decryptedContent = await this.cryptoService.AESdecrypt(
      {
        encrypted: buffer,
        iv: roomKey.iv,
      },
      roomKey.sharedKey,
    );

    // upload decryptedContent to s3
    const s3File = await this.s3UploadService.getObject(
      file.s3key,
      file.bucket,
    );

    const s3Response = await this.s3UploadService.uploadBuffer({
      bucket: file.bucket,
      buffer: decryptedContent,
      contentType: s3File.ContentType,
      key: 'test-decrypt',
      policy: 'private',
    });

    return this.s3UploadService.getS3SignedUrl({
      bucket: file.bucket,
      s3key: s3Response.Key,
      fileType: s3File.ContentType,
    });
  }
}
