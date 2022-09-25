/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { ONE_MINUTE } from 'src/shared/constants';
import { DEFAULT_GAS_LIMIT } from 'src/shared/constants/blockchain';
import { COINGECKO_TOKEN_LIST_INFO } from 'src/shared/constants/coingeckoTokenListInfo';
import {
  DEFAULT_FIAT_RATIO,
  NETWORK_DEFAULT_COIN,
} from 'src/shared/constants/network-mapping.constant';
import { RedisService } from 'src/shared/redis/redis.service';
import { BigNumberTool } from 'src/shared/tools/big-number.tool';

import {
  COINGEKO_MAX_PER_PAGE,
  COINGEKO_URLS,
  TOKEN_LIST_REDIS_KEY,
} from '../constants/coin-price.constant';

@Injectable()
export class CoinPriceService {
  constructor(
    private httpService: HttpService,
    private redisService: RedisService,
  ) {}

  coinPriceInUsdConverter(priceInGwei: number, priceInUsd: number): number {
    // TODO: This should be update later
    return priceInGwei * 1e-9 * DEFAULT_GAS_LIMIT * priceInUsd;
  }

  private findTokenId(tokenSymbol: string) {
    return COINGECKO_TOKEN_LIST_INFO.find(
      (x) => x.symbol.toLowerCase() === tokenSymbol.toLowerCase(),
    )?.id;
  }

  private generateParamsForGetList(
    tokenSymbolList: string[],
    targetCurrency = 'USD',
  ) {
    const cryptoIds = tokenSymbolList
      .map((tokenSymbol) => this.findTokenId(tokenSymbol))
      ?.filter(Boolean);

    return {
      vs_currency: targetCurrency,
      ids: (cryptoIds?.length > 0 && cryptoIds.join(',')) || '',
    };
  }

  async fetchListTokenInfo(tokenSymbolList: string[], targetCurrency = 'USD') {
    const params = this.generateParamsForGetList(
      tokenSymbolList,
      targetCurrency,
    );
    const response = await firstValueFrom(
      this.httpService.get(COINGEKO_URLS.COINS.MARKETS, { params }),
    );
    return response?.data;
  }

  async fetchTokenInfo(tokenSymbol: string) {
    const response = await this.fetchListTokenInfo([tokenSymbol]);
    return response?.[0];
  }

  async getTokenListInfoFromRedis() {
    const rawTokenData = await this.redisService.get(TOKEN_LIST_REDIS_KEY);
    return (rawTokenData && JSON.parse(rawTokenData)) || {};
  }

  async updateTokenListInfoToRedis(newTokenListInfo: any) {
    await this.redisService.set(
      TOKEN_LIST_REDIS_KEY,
      JSON.stringify(newTokenListInfo),
    );
  }

  async getTokenInfo(tokenSymbol: string) {
    const redisTokenListInfo = await this.getTokenListInfoFromRedis();
    const lowerCaseTokenSymbol = tokenSymbol.toLowerCase();
    if (redisTokenListInfo[lowerCaseTokenSymbol]) {
      return redisTokenListInfo[lowerCaseTokenSymbol];
    }
    const tokenInfo = await this.fetchTokenInfo(lowerCaseTokenSymbol);

    const newTokenListInfo = {
      ...redisTokenListInfo,
      [lowerCaseTokenSymbol]: tokenInfo,
    };
    await this.updateTokenListInfoToRedis(newTokenListInfo);

    return tokenInfo;
  }

  async getTokenPriceInUsd(tokenSymbol: string): Promise<number> {
    if (
      tokenSymbol.toLowerCase() === NETWORK_DEFAULT_COIN.eurus.toLowerCase()
    ) {
      return DEFAULT_FIAT_RATIO.eurus;
    }
    const tokenInfo = await this.getTokenInfo(tokenSymbol);
    const tokenPriceInUsd = tokenInfo.current_price;
    return tokenPriceInUsd;
  }

  async calcTokenPriceInUsd(
    tokenSymbol: string,
    amount: string,
  ): Promise<string> {
    const tokenPriceInUsd = await this.getTokenPriceInUsd(tokenSymbol);
    const res = BigNumberTool.toMultiply(amount, tokenPriceInUsd);

    return BigNumberTool.formatNumber(res.toNumber(), 18);
  }

  async getTokenInfoForGetBalance(tokenSymbolList: string[]) {
    const redisTokenListInfo = await this.getTokenListInfoFromRedis();
    const newTokenSymbolList = [];
    tokenSymbolList.forEach((token) => {
      token = token.toLowerCase();
      if (!redisTokenListInfo[token]) newTokenSymbolList.push(token);
    });
    redisTokenListInfo[NETWORK_DEFAULT_COIN.eurus.toLowerCase()] = {
      current_price: DEFAULT_FIAT_RATIO.eurus,
    };
    if (newTokenSymbolList.length == 0) {
      return redisTokenListInfo;
    }
    const newTokenListInfo = await this.fetchListTokenInfo(newTokenSymbolList);

    const updateTokenListInfo = {
      ...redisTokenListInfo,
      ...newTokenListInfo.reduce((acc, cur) => {
        acc[cur.symbol] = cur;
        return acc;
      }, {}),
    };
    this.updateTokenListInfoToRedis(updateTokenListInfo);

    return updateTokenListInfo;
  }

  async crawlData(tokenSymbolList: string[], targetCurrency = 'USD') {
    const numberOfCryptoIds = tokenSymbolList.length;
    const results = [];

    const pageSize = COINGEKO_MAX_PER_PAGE;

    for (let i = 0; i < numberOfCryptoIds; i += pageSize) {
      const tokenSymbolsInPage = tokenSymbolList
        .slice(i, i + pageSize)
        .map((e) => e.toLowerCase());
      const tokenListInfo = await this.fetchListTokenInfo(
        tokenSymbolsInPage,
        targetCurrency,
      );

      results.push(...tokenListInfo);
    }

    return results;
  }

  @Interval(ONE_MINUTE)
  async updateTokenListInfo(): Promise<void> {
    console.debug('Update token list info was called');

    try {
      const tokenListInfo = await this.getTokenListInfoFromRedis();
      const cryptoIds = Object.keys(tokenListInfo);

      const results = await this.crawlData(cryptoIds);

      const newTokenListInfo = {
        ...tokenListInfo,
        ...results.reduce((acc, cur) => {
          acc[cur.symbol] = cur;
          return acc;
        }, {}),
      };

      await this.updateTokenListInfoToRedis(newTokenListInfo);
    } catch (error) {
      console.error(error);
    }
  }
}
