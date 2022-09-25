import { Injectable } from '@nestjs/common';
import AWS from 'aws-sdk';
import { plainToClass } from 'class-transformer';
import crypto from 'crypto';
import { KmsCmk } from 'src/kms-cmk/entities/kms-cmk.entity';
import { KmsCmkService } from 'src/kms-cmk/services/kms-cmk.service';
import { KMS_ENABLED } from 'src/shared/configs/secret';

import { KmsDataKey } from '../entities/kms-data-key.entity';
import { KmsDataKeyRepository } from '../repositories/kms-data-key.repository';

@Injectable()
export class KmsDataKeyService {
  ENCRYPT_ALGORITHM = 'aes256';

  constructor(
    private readonly kmsDataKeyRepository: KmsDataKeyRepository,
    private readonly kmsCmkService: KmsCmkService,
  ) {}

  async getKmsCmk(cmkId?: number): Promise<KmsCmk> {
    let cmk = null;

    if (cmkId) {
      cmk = await this.kmsCmkService.getCmkById(cmkId);
    } else {
      cmk = await this.kmsCmkService.getFirstCmk();
    }
    if (!cmk) {
      console.error('[getKmsCmk] No CMK found');
      return null;
    }

    return cmk;
  }

  async getKmsInstance(cmkId?: number): Promise<AWS.KMS> {
    const cmk = await this.getKmsCmk(cmkId);
    return new AWS.KMS({
      region: cmk.region,
    });
  }

  async generateDataKey(): Promise<KmsDataKey> {
    const cmk = await this.getKmsCmk();

    if (!cmk) {
      console.error('[generateDataKey] No CMK found');
      return null;
    }

    const kmsInstance = await this.getKmsInstance();

    const { Plaintext, CiphertextBlob } = await kmsInstance
      .generateDataKey({
        KeyId: cmk.arn,
        KeySpec: 'AES_256',
      })
      .promise();

    const dataKeyObj = {
      plain: Plaintext.toString('base64'),
      cipher: CiphertextBlob.toString('base64'),
    };

    const newDataKey = plainToClass(KmsDataKey, {
      cmkId: cmk.id,
      dataKey: JSON.stringify(dataKeyObj),
      idEnabled: true,
    });

    const newDataKeyDb = await this.kmsDataKeyRepository.save(newDataKey);

    return newDataKeyDb;
  }

  async getPlainDataKey(dataKeyId?: number): Promise<string> {
    let dataKeyRecord = null;

    if (!dataKeyId) {
      dataKeyRecord = await this.kmsDataKeyRepository.findOne({
        where: {
          idEnabled: true,
        },
      });
    } else {
      dataKeyRecord = await this.kmsDataKeyRepository.findOne(dataKeyId);
    }

    if (!dataKeyRecord) {
      throw new Error('No data key was found');
    }

    const dataKeyData = JSON.parse(dataKeyRecord.dataKey);
    const { cipher } = dataKeyData;

    const kmsInstance = await this.getKmsInstance(dataKeyRecord.cmkId);

    const { Plaintext } = await kmsInstance
      .decrypt({
        CiphertextBlob: Buffer.from(cipher, 'base64'),
      })
      .promise();

    return Plaintext.toString('base64');
  }

  async generateOrGetDataKey(): Promise<KmsDataKey> {
    const dataKey = await this.kmsDataKeyRepository.findOne({
      where: {
        idEnabled: true,
      },
    });

    if (dataKey) {
      return dataKey;
    }

    const newDataKey = await this.generateDataKey();

    if (!newDataKey) {
      console.error('[generateOrGetDataKey] cannot generate data key');
      return null;
    }

    return newDataKey;
  }

  async encrypt(plainText: string, dataKeyId: number): Promise<string> {
    if (typeof plainText !== 'string') {
      throw new Error(`Only support encrypt string for now.`);
    }

    if (!KMS_ENABLED) {
      throw new Error('Please enable KMS first');
    }

    const dataKey = await this.getPlainDataKey(dataKeyId);
    const cipher = crypto.createCipher(
      this.ENCRYPT_ALGORITHM,
      Buffer.from(dataKey, 'base64'),
    );
    let crypted = cipher.update(plainText, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  }

  async decrypt(cipherText: string, dataKeyId: number): Promise<string> {
    if (!dataKeyId) {
      return cipherText;
    }

    if (!KMS_ENABLED) {
      throw new Error('Please enable KMS first');
    }

    const dataKey = await this.getPlainDataKey(dataKeyId);
    const decipher = crypto.createDecipher(
      this.ENCRYPT_ALGORITHM,
      Buffer.from(dataKey, 'base64'),
    );
    let decrypted = decipher.update(cipherText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async encryptWithRandomDataKey(plainText: string): Promise<string> {
    if (typeof plainText !== 'string') {
      throw new Error(`Only support encrypt string for now.`);
    }

    if (!KMS_ENABLED) {
      throw new Error('Please enable KMS first');
    }

    const dataKey = await this.getPlainDataKey();
    const cipher = crypto.createCipher(
      this.ENCRYPT_ALGORITHM,
      Buffer.from(dataKey, 'base64'),
    );
    let crypted = cipher.update(plainText, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  }

  async decryptWithRandomDatakey(cipherText: string): Promise<string> {
    if (!KMS_ENABLED) {
      throw new Error('Please enable KMS first');
    }

    const dataKey = await this.getPlainDataKey();
    const decipher = crypto.createDecipher(
      this.ENCRYPT_ALGORITHM,
      Buffer.from(dataKey, 'base64'),
    );
    let decrypted = decipher.update(cipherText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
