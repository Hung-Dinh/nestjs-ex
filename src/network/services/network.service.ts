/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { CoinPriceService } from 'src/jobs/services/coin-price.service';
import { NetworkFeeService } from 'src/jobs/services/network-fee.service';
import { CHAT_NETWORK_CHAINIDS } from 'src/shared/configs/secret';
import {
  NETWORK_CHAINS,
  NETWORK_DEFAULT_COIN,
  NETWORK_GROUP,
} from 'src/shared/constants/network-mapping.constant';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { NETWORK_FEES } from '../constants/network.constant';
import { NetworkFeesOutput } from '../dtos/network-fee-output';
import { NetworkOutput } from '../dtos/network-output.dto';
import { NetworkRepository } from '../repositories/network.repository';

@Injectable()
export class NetworkService {
  constructor(
    private logger: AppLogger,
    private networkFeeService: NetworkFeeService,
    private coinPriceService: CoinPriceService,
    private readonly networkRepository: NetworkRepository,
  ) {
    // console.log(getConnectionManager().connections)
    this.logger.setContext(NetworkService.name);
  }

  getParentNetworkByChainId(chainId: string): string {
    return Object.entries(NETWORK_CHAINS).find(([, value]) =>
      value.includes(chainId),
    )?.[0];
  }

  async isSharedNetworks(
    networkIdA: number,
    networkIdB: number,
  ): Promise<boolean> {
    if (networkIdA === networkIdB) {
      return true;
    }

    const [networkA, networkB] = await Promise.all([
      this.networkRepository.getById(networkIdA),
      this.networkRepository.getById(networkIdB),
    ]);

    const parentNetworkA = this.getParentNetworkByChainId(networkA.chainId);
    const parentNetworkB = this.getParentNetworkByChainId(networkB.chainId);

    if (parentNetworkA === parentNetworkB) {
      return true;
    }

    const areParentNetworksInSameGroup = Object.values(NETWORK_GROUP).some(
      (members) =>
        members.includes(parentNetworkA) && members.includes(parentNetworkB),
    );

    return areParentNetworksInSameGroup;
  }

  async isNetworkUsedOnChat(networkId: number): Promise<boolean> {
    const network = await this.networkRepository.getById(networkId);
    return CHAT_NETWORK_CHAINIDS.includes(network.chainId);
  }

  async findNetworkById(networkId: number): Promise<NetworkOutput> {
    const userToken = await this.networkRepository.getById(networkId);
    return plainToClass(NetworkOutput, userToken, {
      excludeExtraneousValues: true,
    });
  }

  async getNetworkFeeByLevel(
    networkId: number,
    level: string,
  ): Promise<{
    feeAmount: number;
    feeSymbol: string;
  }> {
    const network = await this.networkRepository.getById(networkId);
    const parentNetworkName = this.getParentNetworkByChainId(network.chainId);

    const networkFees = await this.networkFeeService.getNetworkFees(
      parentNetworkName,
    );

    return {
      feeAmount: networkFees?.[level.toLowerCase()] || 0,
      feeSymbol: NETWORK_DEFAULT_COIN[parentNetworkName],
    };
  }

  async getNetworks(
    ctx: RequestContext,
    offset: number,
    limit: number,
  ): Promise<{
    networkList: NetworkOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.getNetworks.name} called`);

    const [networkList, count] = await this.networkRepository.findAndCount({
      where: {},
      take: limit,
      skip: offset,
    });

    const networkOutput = plainToClass(NetworkOutput, networkList, {
      excludeExtraneousValues: true,
    });

    return {
      networkList: networkOutput,
      count,
    };
  }

  async getNetworkFees(
    ctx: RequestContext,
    networkId: number,
  ): Promise<NetworkFeesOutput[]> {
    this.logger.log(ctx, `${this.getNetworkFees.name} called`);

    const network = await this.networkRepository.getById(networkId);
    const parentNetworkName = this.getParentNetworkByChainId(network.chainId);

    const priceSymbol = NETWORK_DEFAULT_COIN[parentNetworkName];

    const priceSymbolPriceInUsd =
      await this.coinPriceService.getTokenPriceInUsd(priceSymbol);

    const networkFees = await this.networkFeeService.getNetworkFees(
      parentNetworkName,
    );

    const { fast, medium, slow } = networkFees;

    const networkFeesOutput = plainToClass(
      NetworkFeesOutput,
      [
        {
          speed: NETWORK_FEES.SLOW.LABEL,
          price: slow,
          priceSymbol,
          time: NETWORK_FEES.SLOW.TIME,
          priceInUSD: this.coinPriceService.coinPriceInUsdConverter(
            slow,
            priceSymbolPriceInUsd,
          ),
        },
        {
          speed: NETWORK_FEES.MEDIUM.LABEL,
          price: medium,
          priceSymbol,
          time: NETWORK_FEES.MEDIUM.TIME,
          priceInUSD: this.coinPriceService.coinPriceInUsdConverter(
            medium,
            priceSymbolPriceInUsd,
          ),
        },
        {
          speed: NETWORK_FEES.FAST.LABEL,
          price: fast,
          priceSymbol,
          time: NETWORK_FEES.FAST.TIME,
          priceInUSD: this.coinPriceService.coinPriceInUsdConverter(
            fast,
            priceSymbolPriceInUsd,
          ),
        },
      ],
      {
        excludeExtraneousValues: true,
      },
    );

    return networkFeesOutput;
  }

  getNetworkDefaultToken(networkChainId: string): string {
    const networkName =
      Object.entries(NETWORK_CHAINS).find(([, value]) =>
        value.includes(networkChainId),
      )?.[0] || null;

    if (networkName) {
      return NETWORK_DEFAULT_COIN[networkName] || 'Matic';
    }

    return 'Matic';
  }
}
