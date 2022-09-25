import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import * as faker from 'faker';
import {
  MOCK_ADDRESS_LENGTH,
  MOCK_HASH_LENNGTH,
  MOCK_UNSIGNED_LENGTH,
} from 'src/shared/constants';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { MockUserTokenService } from 'src/user-token/services/user-token.mock.service';

import { BlockchainTxOutput } from '../dtos/blockchain-tx-ouput.dto';
import { CreateSendTokenTransactionInput } from '../dtos/create-send-token-transaction-input.dto';
import { BlockchainTx } from '../entities/blockchain-tx.entity';

@Injectable()
export class MockBlockchainTxService {
  blockchainTxList: BlockchainTx[] = [];
  numberOfMockRecords = 10;

  constructor(
    private logger: AppLogger,
    private readonly userTokenService: MockUserTokenService,
  ) {
    this.logger.setContext(MockBlockchainTxService.name);
    this.blockchainTxList = this.generateBlockchainTxList();
  }

  generateBlockchainTxList(): BlockchainTx[] {
    const list: BlockchainTx[] = [];
    for (let i = 0; i < this.numberOfMockRecords; i++) {
      list.push(
        plainToClass(BlockchainTx, {
          id: i,
          fromAddress: faker.random.alphaNumeric(MOCK_ADDRESS_LENGTH),
          toAddress: faker.random.alphaNumeric(MOCK_ADDRESS_LENGTH),
          msgValue: faker.random.words(),
          msgData: faker.random.words(),
          memoCode: faker.random.alphaNumeric(5),
          tokenSymbol: faker.random.word(),
          tokenAddress: faker.random.alphaNumeric(MOCK_ADDRESS_LENGTH),
          networkId: i,
          blockNumber: faker.datatype.number(),
          blockHash: '0x' + faker.random.alphaNumeric(64),
          blockTimestamp: faker.date.past().getTime().toString(),
          feeAmount: faker.datatype.number(),
          feeSymbol: faker.random.word(),
          unsignedRaw: faker.random.alphaNumeric(256),
          signedRaw: faker.random.alphaNumeric(512),
          txHash: '0x' + faker.random.alphaNumeric(64),
          txStatus: 'active',
          retryCount: 0,
          refTable: '',
          refId: 0,
          createdAt: faker.date.past(),
          updatedAt: faker.date.past(),
        }),
      );
    }

    return list;
  }

  async findBlockchainTxById(id: number): Promise<BlockchainTx> {
    return new Promise((resolve) => {
      const blockchainTx = this.blockchainTxList.find(
        (blockchainTx: BlockchainTx) => blockchainTx.id === id,
      );
      resolve(blockchainTx);
    });
  }

  async createAddTokenTransaction(
    ctx: RequestContext,
    input: CreateSendTokenTransactionInput,
  ): Promise<BlockchainTxOutput> {
    this.logger.log(ctx, `${this.createAddTokenTransaction.name} called`);

    const userToken = await this.userTokenService.findTokenById(input.tokenId);

    if (!userToken) {
      throw new NotFoundException('Token not found');
    }

    const newAddTokenTransaction = plainToClass(BlockchainTx, {
      id: this.blockchainTxList.length + 1,
      ...input,
      tokenSymbol: userToken.tokenSymbol,
      tokenAddress: userToken.tokenAddress,
      msgValue: faker.random.words(),
      msgData: faker.random.words(),
      memoCode: faker.random.alphaNumeric(5),
      blockNumber: faker.datatype.number(),
      blockHash: '0x' + faker.random.alphaNumeric(MOCK_HASH_LENNGTH),
      blockTimestamp: faker.date.past().getTime().toString(),
      unsignedRaw: faker.random.alphaNumeric(MOCK_UNSIGNED_LENGTH),
      signedRaw: faker.random.alphaNumeric(MOCK_UNSIGNED_LENGTH),
      txHash: '0x' + faker.random.alphaNumeric(MOCK_HASH_LENNGTH),
      txStatus: 'completed',
      retryCount: 0,
      refTable: '',
      refId: 0,
      createdAt: faker.date.past(),
      updatedAt: faker.date.past(),
    });

    this.blockchainTxList.push(newAddTokenTransaction);

    return new Promise((resolve) => {
      resolve(plainToClass(BlockchainTxOutput, newAddTokenTransaction));
    });
  }
}
