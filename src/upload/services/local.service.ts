import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { SERVER_ADDRESS } from 'src/shared/configs/secret';
import { v4 as uuid } from 'uuid';

export enum EUploadFolder {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
}

const UPLOAD_FOLDER = `${SERVER_ADDRESS}/uploads`;

@Injectable()
export class LocalUploadService {
  getURL(directory: EUploadFolder, filename: string): string {
    return `${UPLOAD_FOLDER}/${directory}/${filename}`;
  }

  getURLMultiDir(directory: string, filename: string): string {
    return `${UPLOAD_FOLDER}/${directory}/${filename}`;
  }

  uploadImage(file: Express.Multer.File, path = ''): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileExtension = file?.originalname?.split('.')?.pop() || '';
      if (!fileExtension) {
        throw new Error('File extension not found!');
      }
      const filename = `${uuid()}-${Date.now()}.${fileExtension}`;

      const filePath = `${process.cwd()}/uploads/${
        EUploadFolder.IMAGE
      }/${filename}`;

      fs.writeFile(filePath, file.buffer, (err: Error) => {
        if (err) {
          return reject(err);
        }

        return resolve(this.getURL(EUploadFolder.IMAGE, filename));
      });
    });
  }
}
