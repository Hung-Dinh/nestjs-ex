import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { firstValueFrom } from 'rxjs';
import { DefaultTokenService } from 'src/default-token/services/default-token.service';
import { CoinPriceService } from 'src/jobs/services/coin-price.service';
import { Actor } from 'src/shared/acl/actor.constant';
import { EURUS_TESTNET_CHAINID, MUMBAI_TESTNET_CHAINID } from 'src/shared/constants';
import { NETWORK_DEFAULT_COIN } from 'src/shared/constants/network-mapping.constant';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { Connection, getManager, In } from 'typeorm';
import { AbiItem } from 'web3-utils';

import { NetworkService } from '../../network/services/network.service';
import { Action } from '../../shared/acl/action.constant';
import { BlockchainService } from '../../shared/blockchain-service/blockchain-service.service';
import { COINGECKO_TOKEN_LIST } from '../../shared/constants/coingeckoTokenList';
import {
  NETWORK_SCAN_ENDPOINT,
  NETWORK_SCAN_NAME,
} from '../constant/network-scan.constant';
import { CalcAmountInUSDInput } from '../dtos/get-price-in-usd-input.dto';
import { AddUserTokenInput } from '../dtos/user-add-token-input.dto';
import { UserTokenOutput } from '../dtos/user-token-output.dto';
import { UserToken } from '../entities/user-token.entity';
import { UserTokenRepository } from '../repositories/user-token.repository';
import { UserTokenAclService } from './user-token-acl.service';

@Injectable()
export class UserTokenService {
  networkScanKey: {
    [key: string]: string;
  } = {};

  constructor(
    private readonly logger: AppLogger,
    private networkService: NetworkService,
    private repository: UserTokenRepository,
    private coinPriceService: CoinPriceService,
    private blockchainService: BlockchainService,
    private readonly aclService: UserTokenAclService,
    private defaultTokenService: DefaultTokenService,
    private httpService: HttpService,
    private connection: Connection,
  ) {
    this.logger.setContext(UserTokenService.name);
    this.networkScanKey = {
      [NETWORK_SCAN_NAME.polygon]: process.env.POLYGONSCAN_API_KEY,
      [NETWORK_SCAN_NAME.mumbai]: process.env.POLYGONSCAN_API_KEY,
      [NETWORK_SCAN_NAME.ethereum]: process.env.ETHERSCAN_API_KEY,
      [NETWORK_SCAN_NAME.eurus]: process.env.ETHERSCAN_API_KEY,
    };
  }

  // async getUserTokenList(
  //   ctx: RequestContext,
  //   userId: number,
  // ): Promise<UserTokenOutput[]> {
  //   this.logger.log(ctx, `${this.getUserTokenList.name} was called`);
  //   const userTokenList = await this.repository.getTokensByUserId(userId);
  //   return userTokenList.map((userToken) =>
  //     plainToClass(UserTokenOutput, userToken, {
  //       excludeExtraneousValues: true,
  //     }),
  //   );
  // }

  async getTokenByAddress(tokenAddress: string): Promise<UserToken> {
    return await this.repository.findOne({
      where: {
        tokenAddress,
      },
    });
  }

  async findById(tokenId: number): Promise<UserToken> {
    return this.repository.getById(tokenId);
  }

  async findByTokenAddressAndUserId(
    tokenAddress: string,
    userId: number,
  ): Promise<UserToken> {
    return await this.repository.findOne({
      where: {
        tokenAddress,
        userId,
      },
    });
  }

  async getUserTokenList(
    ctx: RequestContext,
    userId: number,
    offset: number,
    limit: number,
    networkId: number,
  ): Promise<{
    tokens: UserTokenOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.getUserTokenList.name} was called`);
    const network = await this.networkService.findNetworkById(networkId);
    if (!network) {
      throw new Error('Network not found');
    }

    const defaultTokenList =
      await this.defaultTokenService.getdefaultTokenList();
    const defaultToken = defaultTokenList.find(
      (x) =>
        x.tokenSymbol.toLowerCase() == network.nativeTokenSymbol.toLowerCase(),
    );

    const userTokenList = await this.repository.getTokensByUserIdAndNetworkId(
      userId,
      networkId,
    );

    if (
      defaultToken &&
      network?.nativeTokenSymbol &&
      !userTokenList.find(
        (x) =>
          x.tokenSymbol.toLowerCase() ===
          network.nativeTokenSymbol.toLowerCase(),
      )
    ) {
      const networkName = this.getNetworkName(+network.chainId);
      const contractAbi = await this.getTokenAbi(
        defaultToken.tokenAddress,
        networkName,
      );
      let abi ='';
      if (contractAbi.length > 0) {
        abi = JSON.stringify(contractAbi);
      }
      const newToken = {
        userId: userId,
        networkId: networkId,
        tokenName: defaultToken.tokenName,
        tokenSymbol: defaultToken.tokenSymbol,
        tokenAddress: defaultToken.tokenAddress,
        tokenDecimal: defaultToken.tokenDecimal,
        idEnabled: true,
        logo: defaultToken.logo,
        abi: abi
      };
      const newTokenCreated = await this.repository.save(newToken);
      userTokenList.push(newTokenCreated);
    }

    const count = userTokenList.length;
    const slicedUserTokenList = userTokenList.slice(
      offset,
      Math.min(offset + limit, userTokenList.length),
    );

    return {
      tokens: plainToClass(UserTokenOutput, slicedUserTokenList, {
        excludeExtraneousValues: true,
      }),
      count,
    };
  }

  getNetworkName(chainId: number): string {
    switch (chainId) {
      case 1:
        return NETWORK_SCAN_NAME.ethereum;
      case 137:
        return NETWORK_SCAN_NAME.polygon;
      case 80001:
        return NETWORK_SCAN_NAME.mumbai;
      case 1984:
        return NETWORK_SCAN_NAME.eurus;  
      default:
        return NETWORK_SCAN_NAME.mumbai;
    }
  }

  async findByTokenAddress(tokenAddress: string): Promise<UserToken> {
    // find token by token address which has abi
    return this.repository
      .createQueryBuilder('user_token')
      .where('LOWER(user_token.tokenAddress) = LOWER(:tokenAddress)', {
        tokenAddress,
      })
      .andWhere("user_token.abi is not null and user_token.abi != ''")
      .getOne();
  }

  async getTokenAbi(
    contractAddress: string,
    networkName: string,
  ): Promise<AbiItem[]> {
    try {
      const userTokenWithSameAddress = await this.findByTokenAddress(
        contractAddress,
      );

      let contractAbi = [];

      if (userTokenWithSameAddress) {
        contractAbi = JSON.parse(userTokenWithSameAddress.abi);
      } else {
        /**
         * !! Note that if we use free API, we might get a 429 error because of rate limit
         */
        const response = await firstValueFrom(
          this.httpService.get(
            `${NETWORK_SCAN_ENDPOINT[networkName]}?module=contract&action=getabi&address=${contractAddress}&apikey=${this.networkScanKey[networkName]}`,
          ),
        );
        // console.log('response?.data?.result:  ',response?.data?.result, contractAddress, networkName);
        if (response?.data?.result) {
          contractAbi = JSON.parse(response.data.result);
        }
      }

      return contractAbi;
    } catch (error) {
      console.error(`[getContractAbi] error`, error);

      return [];
    }
  }

  async addToken(
    ctx: RequestContext,
    newToken: AddUserTokenInput,
  ): Promise<UserTokenOutput> {
    this.logger.log(ctx, `${this.addToken.name} was called`);
    const userTokenList = await this.repository.getTokensByUserId(ctx.user.id);
    newToken.tokenAddress = newToken.tokenAddress.toLowerCase();
    if (userTokenList.find((x) => x.tokenAddress == newToken.tokenAddress)) {
      throw new Error('This token had been added!');
    }
    const userToken = plainToClass(UserToken, newToken);

    const network = await this.networkService.findNetworkById(
      newToken.networkId,
    );
    if (!network) {
      throw new Error('Network not found');
    }
    const providerUrl = network.rpcEndpoint;
    let tokenInfo = null;
    try {
      tokenInfo = await this.blockchainService.getTokenInfomation(
        providerUrl,
        userToken.tokenAddress,
      );
    } catch (error) {
      console.error(`[getTokenInfomation] error`, error);
      throw new Error(
        'Something went wrong. Please make sure you have entered the correct token address.',
      );
    }

    userToken.tokenDecimal = tokenInfo.tokenDecimal;
    userToken.tokenName = tokenInfo.tokenName;
    userToken.tokenSymbol = tokenInfo.tokenSymbol;
    userToken.userId = ctx.user.id;
    userToken.idEnabled = true;
    const tokenLogo = COINGECKO_TOKEN_LIST.find(
      (x) => x.symbol == userToken.tokenSymbol,
    );
    if (tokenLogo) userToken.logo = tokenLogo.logoURI;

    //  Mumbai Testnet, Eurus Testnest token logo set default null to use Matic logo
    if (network.chainId == MUMBAI_TESTNET_CHAINID || network.chainId == EURUS_TESTNET_CHAINID) {
      userToken.logo = null;
    }

    userToken.abi = '';

    if (
      userToken.tokenSymbol.toLowerCase() !==
        NETWORK_DEFAULT_COIN.polygon.toLowerCase() &&
      userToken.tokenSymbol.toLowerCase() !==
        NETWORK_DEFAULT_COIN.ethereum.toLowerCase()
    ) {
      const networkName = this.getNetworkName(+network.chainId);
      const contractAbi = await this.getTokenAbi(
        userToken.tokenAddress,
        networkName,
      );
      if (contractAbi.length > 0) {
        userToken.abi = JSON.stringify(contractAbi);
      } 
    }

    this.logger.log(ctx, `calling ${UserTokenRepository.name}.save token`);
    await this.repository.save(userToken);

    return plainToClass(UserTokenOutput, userToken, {
      excludeExtraneousValues: true,
    });
  }

  async removeTokenById(ctx: RequestContext, tokenId: number): Promise<void> {
    this.logger.log(ctx, `${this.removeTokenById.name} was called`);
    this.logger.log(ctx, `calling ${UserTokenRepository.name}.getById`);

    const userToken = await this.repository.getById(tokenId);

    const actor: Actor = ctx.user;
    const isAllowed = this.aclService
      .forActor(actor)
      .canDoAction(Action.Delete, userToken);

    if (!isAllowed) {
      throw new Error('Unauthorized');
    }

    this.logger.log(ctx, `calling ${UserTokenRepository.name}.remove`);
    await this.repository.remove(userToken);
  }

  async getTokenById(tokenId: number): Promise<UserTokenOutput> {
    const userToken = await this.repository.getById(tokenId);
    return plainToClass(UserTokenOutput, userToken, {
      excludeExtraneousValues: true,
    });
  }

  async getTokenListByUserIdAndnetworkId(
    userId: number,
    networkId: number,
  ): Promise<UserTokenOutput[]> {
    const userTokenList = await this.repository.getTokensByUserIdAndNetworkId(
      userId,
      networkId,
    );
    return plainToClass(UserTokenOutput, userTokenList, {
      excludeExtraneousValues: true,
    });
  }

  async addNewUserToken(tokenItem: Record<string, any>) {
    const userToken = plainToClass(UserToken, tokenItem);
    const newUserToken = await this.repository.save(userToken);
    return plainToClass(UserTokenOutput, newUserToken, {
      excludeExtraneousValues: true,
    });
  }

  async calcAmountInUSD(
    ctx: RequestContext,
    input: CalcAmountInUSDInput,
  ): Promise<number> {
    try {
      this.logger.log(ctx, `${this.calcAmountInUSD.name} was called`);

      const tokenPriceInUSD = await this.coinPriceService.getTokenPriceInUsd(
        input.tokenSymbol,
      );
      return tokenPriceInUSD * input.amount;
    } catch (error) {
      this.logger.error(ctx, error);
    }

    return 0;
  }

  async getAllTokenFromNetwork(networkId: number) {
    const sql = ` select distinct tokenSymbol, tokenName, tokenAddress, tokenDecimal, networkId 
    from user_token
    where networkId = ${networkId}`;
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // return await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    return entityManager.query(sql);
  }

  async getTokensByTokenAddresses(
    tokenAddress: string[],
  ): Promise<UserToken[]> {
    return this.repository.find({
      where: {
        tokenAddress: In(tokenAddress),
      },
    });
  }
}
