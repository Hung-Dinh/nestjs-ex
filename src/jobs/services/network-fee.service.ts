import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { ETHERSCAN_API_KEY } from 'src/shared/configs/secret';
import { ONE_MINUTE } from 'src/shared/constants';
import {
  DEFAULT_GAS_PRICE,
  NETWORK_NAMES,
} from 'src/shared/constants/network-mapping.constant';
import { RedisService } from 'src/shared/redis/redis.service';
import { ObjectTool } from 'src/shared/tools/object.tool';

import { GAS_TRACKER_ENDPOINTS } from '../constants/network.constant';
import {
  NetworkFeesOutput,
  NetworksFeesOutput,
} from '../dtos/network-fees-output.dto';

@Injectable()
export class NetworkFeeService {
  private gasTrackerApis: {
    [network: string]: string;
  } = {
    polygon: GAS_TRACKER_ENDPOINTS.POLYGON,
    etherium: `${GAS_TRACKER_ENDPOINTS.ETHERIUM}${ETHERSCAN_API_KEY}`,
  };

  constructor(
    private httpService: HttpService,
    private redisService: RedisService,
  ) {}

  feesConverter(rawData: any, network: string): NetworkFeesOutput {
    switch (network) {
      /**
       * Polygon & Etherium
       * rawData:  {
       *  FastGasPrice: "75"
          LastBlock: "22874634"
          ProposeGasPrice: "36.3"
          SafeGasPrice: "33"
          UsdPrice: "2.56"
       * }
       */
      case 'polygon':
      case 'etherium':
        return {
          fast: rawData.FastGasPrice,
          medium: rawData.ProposeGasPrice,
          slow: rawData.SafeGasPrice,
        };
      default:
        return {
          fast: 0,
          medium: 0,
          slow: 0,
        };
    }
  }

  async fetchNetworkFees(): Promise<NetworksFeesOutput[]> {
    return Promise.all(
      Object.entries(this.gasTrackerApis).map(async ([network, url]) => {
        const response = await firstValueFrom(this.httpService.get(url));
        const data = response?.data?.result;
        return {
          network,
          data: data && this.feesConverter(data, network),
        };
      }),
    );
  }

  async getNetworksFeesFromRedis(): Promise<NetworksFeesOutput> {
    const rawCurrentNetworkFees = await this.redisService.get('networkFees');
    return (rawCurrentNetworkFees && JSON.parse(rawCurrentNetworkFees)) || {};
  }

  async getNetworkFees(networkName: string): Promise<{
    fast: number;
    medium: number;
    slow: number;
  }> {
    if (networkName.toLowerCase() === NETWORK_NAMES.eurus.toLowerCase()) {
      return {
        fast: DEFAULT_GAS_PRICE.eurus,
        medium: DEFAULT_GAS_PRICE.eurus,
        slow: DEFAULT_GAS_PRICE.eurus,
      };
    }

    let networkFees = {};
    networkFees = await this.getNetworksFeesFromRedis();
    if (!networkFees) {
      networkFees = await this.fetchNetworkFees();
    }

    return networkFees[networkName];
  }

  @Interval(ONE_MINUTE)
  async handleUpdateNetworkFee(): Promise<void> {
    console.debug('Update network fees job was called');
    try {
      const newestNetworkFees = await this.fetchNetworkFees();
      const currentNetworkFeesInRedis = await this.getNetworksFeesFromRedis();

      newestNetworkFees?.forEach((response) => {
        const { network, data } = response;

        if (!ObjectTool.isEmpty(data)) {
          currentNetworkFeesInRedis[network] = data;
        }
      });

      await this.redisService.set(
        'networkFees',
        JSON.stringify(currentNetworkFeesInRedis),
      );
    } catch (error) {
      console.error(error);
    }
  }
}
