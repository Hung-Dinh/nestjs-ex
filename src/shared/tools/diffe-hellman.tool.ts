import crypto from 'crypto';

export class DiffeHellmanTool {
  static createKeyPair(): {
    publicKey: string;
    privateKey: string;
  } {
    const keyPair = crypto.createECDH('prime192v1');
    const publicKey = keyPair.generateKeys();
    const privateKey = keyPair.getPrivateKey();
    return {
      publicKey: publicKey.toString('base64'),
      privateKey: privateKey.toString('base64'),
    };
  }

  static generateInitializationVector(): string {
    return crypto.randomBytes(16).toString('base64');
  }

  static createSharedKey(publicKeyA: string, privateKeyB: string): string {
    const keyPair = crypto.createECDH('prime192v1');
    keyPair.setPrivateKey(Buffer.from(privateKeyB, 'base64'));
    const sharedKey = keyPair.computeSecret(Buffer.from(publicKeyA, 'base64'));
    return sharedKey.toString('base64');
  }

  static async encrypt(
    text: string,
    secret: string,
    iv: string,
  ): Promise<string> {
    return new Promise((resolve) => {
      const algorithm = 'aes-256-ctr';
      const secretKey = secret;
      const ivBuffer = Buffer.from(iv, 'base64');
      const cipher = crypto.createCipheriv(algorithm, secretKey, ivBuffer);
      const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

      resolve(encrypted.toString('base64'));
    });
  }

  static async decrypt(
    hash: {
      iv: string;
      content: string;
    },
    secret: string,
  ): Promise<string> {
    return new Promise((resolve) => {
      const algorithm = 'aes-256-ctr';
      const secretKey = secret;

      const decipher = crypto.createDecipheriv(
        algorithm,
        secretKey,
        Buffer.from(hash.iv, 'base64'),
      );

      const decrpyted = Buffer.concat([
        decipher.update(Buffer.from(hash.content, 'base64')),
        decipher.final(),
      ]);

      resolve(decrpyted.toString());
    });
  }
}
