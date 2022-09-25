import { Injectable } from '@nestjs/common';
import crypto from 'crypto';

@Injectable()
export class CryptoService {
  AES_ALGORITHM = 'aes-256-ctr';

  async AESEncrypt(buffer: any, secret: string, iv: string): Promise<Buffer> {
    return new Promise((resolve) => {
      const secretKey = secret;
      const ivBuffer = Buffer.from(iv, 'base64');
      const cipher = crypto.createCipheriv(
        this.AES_ALGORITHM,
        secretKey,
        ivBuffer,
      );
      const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

      resolve(encrypted);
    });
  }

  async AESdecrypt(
    hash: {
      iv: string;
      encrypted: any;
    },
    secret: string,
  ): Promise<Buffer> {
    return new Promise((resolve) => {
      const secretKey = secret;

      const decipher = crypto.createDecipheriv(
        this.AES_ALGORITHM,
        secretKey,
        Buffer.from(hash.iv, 'base64'),
      );

      const decrpyted = Buffer.concat([
        decipher.update(hash.encrypted),
        decipher.final(),
      ]);

      resolve(decrpyted);
    });
  }
}
