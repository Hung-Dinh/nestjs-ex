import { Injectable } from '@nestjs/common';
import {Buffer} from 'buffer/';
import * as crypto from 'crypto';
// import * as sshpk from 'sshpk';

@Injectable()
export class RsaService {
  
  private privateKey: string;
  private publicKey: string;
  private enabled: string;
  
  constructor() {
    this.privateKey = process.env.JWT_PRIVATE_KEY_BASE64;
    this.publicKey = process.env.JWT_PUBLIC_KEY_BASE64;
    this.enabled = process.env.RSA_ENABLED;
  }

  generateKey(): Record<string, any>{
    const {publicKey,privateKey} = crypto.generateKeyPairSync("rsa", {
        // The standard secure default length for RSA keys is 2048 bits
        modulusLength: 2048,
    })
      
      console.log(
        publicKey.export({
          type: "pkcs1",
          format: "pem",
        }),
      
        privateKey.export({
          type: "pkcs1",
          format: "pem",
        })
      )
    return   {publicKey,privateKey}

  }

  stringToHTML(str: string): string {
    
    const listString = str.split("\\n");
    let htmlString = ``;
    listString.forEach((e,index) =>{
      if(index == 0){
        htmlString += e;
      } else {
        htmlString += `\n` + e;
      }
    })
    return htmlString
  };

  
  encrypt(plaintext: string): string {
   
    // const htmlPublicKey = this.stringToHTML(this.publicKey);
    // const  publicKey = sshpk.parseKey(htmlPublicKey, 'ssh');
    // const publicKeyPkcs8= publicKey.toBuffer('pkcs8');  

    const encryptedData = crypto.publicEncrypt(
      Buffer.from(
        this.publicKey,
        'base64',
      ).toString('utf8'),
      // We convert the data string to a buffer using `Buffer.from`
      Buffer.from(plaintext)
    );

    return encryptedData.toString('base64');
  }

  decrypt(cypher: string): string {
    // const htmlPrivateKey = this.stringToHTML(this.privateKey);
    // const  privateKey = sshpk.parsePrivateKey(htmlPrivateKey, 'ssh');
    // const privateKeyPkcs8 = privateKey.toBuffer('pkcs8'); 

    const decryptedData = crypto.privateDecrypt(
      Buffer.from(
        this.privateKey,
        'base64',
      ).toString('utf8'),
      Buffer.from(cypher, 'base64')
        
    )

    return decryptedData.toString('utf8')
  }

  encryptBody(body: Record<string, any>) : string{
    return this.encrypt(JSON.stringify(body))
  }

  decryptBody(bodyCypher: string): Record<string, any>{
    return JSON.parse(this.decrypt(bodyCypher))
  }

  isRsaDisabled(): boolean {
    const rsaEnabled = process.env.RSA_ENABLED;
    return !rsaEnabled || ['false', 'n', 'no', 'N', 'NO'].includes(rsaEnabled);
  }

}