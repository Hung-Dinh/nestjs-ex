import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/shared/logger/logger.service';
import { In } from 'typeorm';

import { BlockchainTx } from '../entities/blockchain-tx.entity';
import { BlockchainTxRepository } from '../repositories/blockchain-tx.repository';

@Injectable()
export class BlockchainTxService {
  constructor(
    private logger: AppLogger,
    private readonly blockchainTxRepository: BlockchainTxRepository,
  ) {
    this.logger.setContext(BlockchainTxService.name);
  }

  async getBlockchainTxListByWalletAddressAndTokenAddressAndNetworkId(
    tokenAddress: string,
    walletAddress: string,
    networkId: number,
    offset: number,
    limit: number,
  ): Promise<{
    blockchainTxList: BlockchainTx[];
    count: number;
  }> {
    const [blockchainTxList, count] =
      await this.blockchainTxRepository.findAndCount({
        where: [
          {
            tokenAddress,
            networkId,
            fromAddress: walletAddress,
          },
          {
            tokenAddress,
            networkId,
            toAddress: walletAddress,
          },
        ],
        take: limit,
        skip: offset,
      });

    return {
      blockchainTxList,
      count,
    };
  }

  async getBlockchainTxListWhereRefIdInIds(
    ids: number[],
  ): Promise<BlockchainTx[]> {
    return this.blockchainTxRepository.find({
      where: {
        refId: In(ids),
      },
    });
  }

  async getBlockchainTxByRefIdAndRefTable(
    refId: number,
    refTable: string,
  ): Promise<BlockchainTx> {
    return this.blockchainTxRepository.findOne({
      where: {
        refId,
        refTable,
      },
    });
  }

  async getBlockchainTxByRefIdAndRefTableList(
    refIdAndRefTableList: {
      refId: number;
      refTable: string;
    }[],
  ): Promise<BlockchainTx[]> {
    return this.blockchainTxRepository.find({
      where: refIdAndRefTableList,
    });
  }
}
