import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { GetObjectOutput } from 'aws-sdk/clients/s3';
import {
  AWS_ACCESS_KEY_ID,
  AWS_PRIVATE_BUCKET_NAME,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
} from 'src/shared/configs/secret';
import { v4 as uuid } from 'uuid';

type POLICY =
  | 'public-read'
  | 'authenticated-read'
  | 'bucket-owner-read'
  | 'bucket-owner-full-control'
  | 'private';

@Injectable()
export class S3UploadService {
  s3: S3;

  constructor() {
    this.s3 = new S3({
      /*credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },*/
      region: AWS_REGION,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    policy: POLICY = 'public-read',
    path = '',
  ): Promise<any> {
    const fileExtension = file?.originalname?.split('.')?.pop() || '';
    if (!fileExtension) {
      throw new Error('File extension not found!');
    }
    const filename = `${
      path ? `${path}/` : ''
    }${uuid()}-${Date.now()}.${fileExtension}`;
    const response = await this.s3
      .upload({
        Bucket: AWS_PRIVATE_BUCKET_NAME,
        Body: file.buffer,
        ContentType: file.mimetype,
        Key: filename,
        ACL: policy,
      })
      .promise();

    return response;
  }

  async getS3SignedUrl({
    bucket,
    s3key,
    fileType,
  }: {
    fileType: string;
    bucket: string;
    s3key: string;
  }): Promise<string> {
    const { key, bucket: bucketName } = this.getKeyAndBucket(s3key, bucket);

    return this.s3.getSignedUrlPromise('getObject', {
      Bucket: bucketName,
      Key: key,
      Expires: 3600,
      ResponseContentType: fileType,
    });
  }

  private getKeyAndBucket(
    s3Key: string,
    s3Bucket: string,
  ): { bucket: string; key: string } {
    let key = s3Key;
    let bucket = s3Bucket;
    if (key.includes('/')) {
      const splittedBySlash = key.split('/');
      const len = splittedBySlash.length;
      key = splittedBySlash[len - 1];
      if (len > 1) {
        bucket += `/${splittedBySlash.slice(0, len - 1).join('/')}`;
      }
    }

    return {
      key,
      bucket,
    };
  }

  async uploadBuffer({
    bucket,
    buffer,
    key,
    policy = 'public-read',
    contentType,
  }: {
    buffer: Buffer;
    key: string;
    bucket: string;
    policy: POLICY;
    contentType: string;
  }): Promise<S3.ManagedUpload.SendData> {
    console.log('key', key);

    const response = await this.s3
      .upload({
        Bucket: bucket || AWS_PRIVATE_BUCKET_NAME,
        Body: buffer,
        Key: key,
        ContentType: contentType,
        ACL: policy,
      })
      .promise();

    return response;
  }

  async getObject(s3Key: string, bucket: string): Promise<GetObjectOutput> {
    const response = await this.s3
      .getObject({
        Bucket: bucket || AWS_PRIVATE_BUCKET_NAME,
        Key: s3Key,
      })
      .promise();

    return response;
  }
}
