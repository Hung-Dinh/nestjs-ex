import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { toSeed } from "bip39-ts";
import { plainToClass } from 'class-transformer';
import { hdkey } from 'ethereumjs-wallet';
import { WALLET_HD_PATH } from 'src/shared/constants';
import { StringTool } from 'src/shared/tools/string.tool';
import { UserHdWalletService } from 'src/user-hdwallet/services/user-hdwallet.service';
import { UserSettingService } from 'src/user-setting/services/user-setting.service';
import { UserWalletService } from 'src/user-wallet/services/user-wallet.service';
import Web3 from 'web3';

import { AppLogger } from '../../shared/logger/logger.service';
import { RsaService } from '../../shared/middlewares/rsa-decrypt/rsa-decrypt.service';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { UserOutput } from '../../user/dtos/user-output.dto';
import { UserService } from '../../user/services/user.service';
import { ROLE } from '../constants/role.constant';
import { RefreshTokenInput } from '../dtos/auth-refresh-token-input.dto';
import { RegisterInput } from '../dtos/auth-register-input.dto';
import { RegisterOutput } from '../dtos/auth-register-output.dto';
import {
  AuthTokenOutput,
  UserAccessTokenClaims,
} from '../dtos/auth-token-output.dto';
import { ImportWalletOutput } from '../dtos/import-wallet-output.dto';
import { RecoverOutput } from '../dtos/recover-output.dto';
import { RecoverPrivateKeyInput } from '../dtos/recover-private-key-input.dto';
import { RecoverSeedPhraseInput } from '../dtos/recover-seed-phrase-input.dto';


@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private userHdWalletService: UserHdWalletService,
    private userWalletService: UserWalletService,
    private readonly logger: AppLogger,
    private rsaService: RsaService,
    private userSettingService: UserSettingService,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async validateUser(
    ctx: RequestContext,
    username: string,
    pass: string,
  ): Promise<UserAccessTokenClaims> {
    this.logger.log(ctx, `${this.validateUser.name} was called`);

    // The userService will throw Unauthorized in case of invalid username/password.
    const user = await this.userService.validateUsernamePassword(
      ctx,
      username,
      pass,
    );

    // Prevent disabled users from logging in.
    if (user.isAccountDisabled) {
      throw new Error('This user account has been disabled');
    }

    return user;
  }

  login(ctx: RequestContext): AuthTokenOutput {
    this.logger.log(ctx, `${this.login.name} was called`);

    return this.getAuthToken(ctx, ctx.user);
  }

  async generateUniqueUsername(): Promise<string> {
    let username = '';
    while (1) {
      username = StringTool.generateRandomWord();
      const doesUsernameExist = await this.userService.doesUsernameExist(
        username,
      );

      if (!doesUsernameExist) {
        break;
      }
    }

    return username;
  }

  async register(
    ctx: RequestContext,
    input: RegisterInput,
  ): Promise<RegisterOutput> {
    this.logger.log(ctx, `${this.register.name} was called`);

    if (input.password !== input.confirmPassword) {
      throw new BadRequestException(
        'Password and confirm password do not match',
      );
    }

    // TODO : Setting default role as USER here. Will add option to change this later via ADMIN users.
    input.roles = [ROLE.USER];
    input.isAccountDisabled = false;

    // check seedPhrase already exists
    if (input.seedPhrase) {
      input.seedPhrase = input.seedPhrase.replace(/  +/g, ' ').trim();
      const existSeedPhrase =
        await this.userHdWalletService.findUserHdWalletBySeedPhrase(
          input.seedPhrase,
        );
      if (existSeedPhrase) {
        throw new Error('Error hd wallet already exists');
      }
    }

    // check privateKey already exists
    if (input.privateKey) {
      const existUserWallet =
        await this.userWalletService.findUserWalletByPrivateKey(
          input.privateKey,
        );
      if (existUserWallet) {
        throw new Error('Error wallet already exists');
      }
    }

    const checkexistAddress = await this.userWalletService.checkAddress(
      ctx,
      input.walletAddress,
    );
    if (checkexistAddress) {
      throw new Error('Wallet already exists');
    }

    const username = await this.generateUniqueUsername();

    const registeredUser = await this.userService.createUser(ctx, {
      ...input,
      username,
    });

    // create new hd wallet
    const newUserHdWallet = await this.userHdWalletService.createHdWallet(ctx, {
      userId: registeredUser.id,
      seedPhrase: input.seedPhrase,
      networkId: input.networkId,
      hdWalletPath: input.hdWalletPath,
      isExternal: input.isExternal,
    });

    if (!newUserHdWallet) {
      throw new Error('Error creating hd wallet');
    }

    // create new wallet
    const newUserWallet = await this.userWalletService.createUserWallet(ctx, {
      userId: registeredUser.id,
      networkId: input.networkId,
      privateKey: input.privateKey,
      userHDWalletId: newUserHdWallet.id,
      walletAddress: input.walletAddress,
      hdPath: input.hdWalletPath,
      isExternal: input.isExternal,
    });

    if (!newUserWallet) {
      throw new Error('Failed to create wallet');
    }

    await this.userSettingService.createDefaultSetting({
      userId: registeredUser.id,
      networkId: input.networkId,
      userWalletId: newUserWallet.id,
    });

    return plainToClass(
      RegisterOutput,
      {
        ...registeredUser,
        hdWalletId: newUserHdWallet.id,
        userWalletId: newUserWallet.id,
        seedPhrase:
          this.rsaService.isRsaDisabled() || !input.seedPhrase
            ? input.seedPhrase
            : this.rsaService.encrypt(input.seedPhrase),
        privateKey:
          this.rsaService.isRsaDisabled() || !input.privateKey
            ? input.privateKey
            : this.rsaService.encrypt(input.privateKey),
        ...this.getAuthToken(ctx, registeredUser),
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async refreshToken(
    ctx: RequestContext,
    credential: RefreshTokenInput,
  ): Promise<AuthTokenOutput> {
    this.logger.log(ctx, `${this.refreshToken.name} was called`);
    const { refreshToken } = credential;
    const { sub } = await this.jwtService.verify(refreshToken);
    if (!sub) {
      throw new Error('Invalid refresh token');
    }

    const user = await this.userService.findById(ctx, sub);
    if (!user) {
      throw new NotFoundException('Invalid user id');
    }

    return this.getAuthToken(ctx, user);
  }

  getAuthToken(
    ctx: RequestContext,
    user: UserAccessTokenClaims | UserOutput,
  ): AuthTokenOutput {
    this.logger.log(ctx, `${this.getAuthToken.name} was called`);

    const subject = { sub: user.id };
    const payload = {
      username: user.username,
      sub: user.id,
      roles: user.roles,
    };

    const authToken = {
      refreshToken: this.jwtService.sign(subject, {
        expiresIn: this.configService.get('jwt.refreshTokenExpiresInSec'),
      }),
      accessToken: this.jwtService.sign(
        { ...payload, ...subject },
        { expiresIn: this.configService.get('jwt.accessTokenExpiresInSec') },
      ),
    };
    return plainToClass(AuthTokenOutput, authToken, {
      excludeExtraneousValues: true,
    });
  }

  async generateRecoverOutput(
    ctx: RequestContext,
    userId: number,
  ): Promise<RecoverOutput> {
    const user = await this.userService.findById(ctx, userId);
    const authToken = this.getAuthToken(ctx, user);

    return plainToClass(RecoverOutput, {
      result: true,
      message: 'ok',
      accessToken: authToken.accessToken,
      refreshToken: authToken.refreshToken,
      user,
    });
  }

  async updateUsername(userId: number): Promise<UserOutput> {
    const newUsername = await this.generateUniqueUsername();
    const updatedUser = await this.userService.updateUsername(
      userId,
      newUsername,
    );

    return updatedUser;
  }

  async verifyPrivateKey(
    ctx: RequestContext,
    input: RecoverPrivateKeyInput,
  ): Promise<RecoverOutput> {
    this.logger.log(ctx, `${this.verifyPrivateKey.name} was called`);

    const userWallet = await this.userWalletService.findUserWalletByPrivateKey(
      input.privateKey,
    );

    if (!userWallet) {
      return plainToClass(RecoverOutput, {
        result: false,
        message: 'User wallet not found',
        accessToken: null,
        user: null,
      });
    }

    // await this.updateUsername(userWallet.userId);
    return this.generateRecoverOutput(ctx, userWallet.userId);
  }

  async verifySeedPhrase(
    ctx: RequestContext,
    input: RecoverSeedPhraseInput,
  ): Promise<RecoverOutput> {
    this.logger.log(ctx, `${this.verifySeedPhrase.name} was called`);
    
    if (
      !this.userHdWalletService.validateUserSeedPhrase(
        input.seedPhrase.replace(/  +/g, ' ').trim(),
      )
    ) {
      return plainToClass(RecoverOutput, {
        result: false,
        message: 'Invalid seed phrase',
        accessToken: null,
        user: null,
      });
    }

    const userHdWallet =
      await this.userHdWalletService.findUserHdWalletBySeedPhrase(
        input.seedPhrase.replace(/  +/g, ' ').trim(),
      );

    if (!userHdWallet) {
      return plainToClass(RecoverOutput, {
        result: false,
        message: 'User wallet not found',
        accessToken: null,
        user: null,
      });
    }

    // await this.updateUsername(userHdWallet.userId);
    return this.generateRecoverOutput(ctx, userHdWallet.userId);
  }

  async importWalletFromSeedPhrase(
    ctx: RequestContext,
    seedPhrase: string, 
    count: number
  ): Promise<ImportWalletOutput> {
    this.logger.log(ctx, `${this.importWalletFromSeedPhrase.name} was called`);
    const mnemonic = seedPhrase.replace(/  +/g, ' ').trim();
    const seed = toSeed(mnemonic);
    const hdwallet = hdkey.fromMasterSeed(seed);
    const accounts = [];
    for (let i = 0; i < count; i++) {
      const wallet = hdwallet.derivePath(WALLET_HD_PATH + i).getWallet();
      const address = "0x" + wallet.getAddress().toString("hex");
      const privateKey = wallet.getPrivateKey().toString("hex");
      accounts.push({ 
        walletAddress: address,
        privateKey:
        this.rsaService.isRsaDisabled() || !privateKey
          ? privateKey
          : this.rsaService.encrypt(privateKey),
        seedPhrase: 
        this.rsaService.isRsaDisabled() || !seedPhrase
          ? seedPhrase
          : this.rsaService.encrypt(seedPhrase),
      });
    }
    return plainToClass(ImportWalletOutput,  accounts[0], {
      excludeExtraneousValues: true,
    });
  }

  async importWalletFromPrivateKey(
    ctx: RequestContext,
    privateKey: string
  ): Promise<ImportWalletOutput> {
    this.logger.log(ctx, `${this.importWalletFromPrivateKey.name} was called`);
    const mWeb3 = new Web3();
    const formatPrivateKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
    const wallet = mWeb3.eth.accounts.privateKeyToAccount(
      formatPrivateKey,
    );
    if(!wallet?.address){
      throw Error("Wallet address not found");
    }
    return plainToClass(ImportWalletOutput, {
      privateKey:
      this.rsaService.isRsaDisabled() || !privateKey
        ? privateKey
        : this.rsaService.encrypt(privateKey),
      walletAddress: wallet?.address,
    }, {
      excludeExtraneousValues: true,
    });
    
  };
}