import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { RsaService } from './rsa-decrypt.service';

@Injectable()
export class RsaDecryptMiddleware implements NestMiddleware {
  shouldBeDecryptedFields: string[] = [];

  constructor(private rsaService: RsaService) {
    this.shouldBeDecryptedFields = [
      'seedPhrase',
      'privateKey',
      'secretKey',
      'password',
      'confirmPassword',
    ];
  }

  decryptRequest(body: Record<string, any>): Record<string, any> {
    this.shouldBeDecryptedFields.forEach((field) => {
      if (field in body) {
        body[field] = this.rsaService.decrypt(body[field]);
      }
    });
    return body;
  }

  // encyptResponse(data: Record<string, any>): Record<string, any> {
  //   this.shouldBeDecryptedFields.forEach((field) => {
  //     if (field in data) {
  //       data[field] = this.rsaService.encrypt(data[field]);
  //     }
  //   });
  //   return data;
  // }

  shouldNotDecrypt(): boolean {
    const rsaEnabled = process.env.RSA_ENABLED;
    return !rsaEnabled || ['false', 'n', 'no', 'N', 'NO'].includes(rsaEnabled);
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (this.shouldNotDecrypt()) {
      next();
    } else {
      // if (req.params) {
      //   if(req.params.data){
      //     const decryptParamsObject = this.rsaService.decryptBody(req.params.data);
      //     req.params = decryptParamsObject;
      //   } else {
      //     req.params = {};
      //   }
      // }

      if (req.body) {
        req.body = this.decryptRequest(req.body);
      }
      next();
    }
  }
}
