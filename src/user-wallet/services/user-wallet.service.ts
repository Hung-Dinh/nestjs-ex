import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { plainToClass } from 'class-transformer';
import { ChatRoomService } from 'src/chat-room/services/chat-room.service';
// import * as faker from 'faker';
import { DefaultTokenService } from 'src/default-token/services/default-token.service';
import { CoinPriceService } from 'src/jobs/services/coin-price.service';
import { KmsDataKeyService } from 'src/kms-data-key/services/kms-data-key.service';
import { MemberInRoomService } from 'src/member-in-room/services/member-in-room.service';
import { NetworkService } from 'src/network/services/network.service';
import { BlockchainService } from 'src/shared/blockchain-service/blockchain-service.service';
import { POLYGON } from 'src/shared/blockchain-service/constants/smart-contract.constant';
import { KMS_ENABLED } from 'src/shared/configs/secret';
import {
  BALANCE_DECIMAL_PLACES,
  MAX_MESSAGE_LENGTH,
  TRANSACTION_TYPES,
} from 'src/shared/constants';
import {
  DEFAULT_FIAT_RATIO,
  NETWORK_DEFAULT_COIN,
} from 'src/shared/constants/network-mapping.constant';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { UserSettingService } from 'src/user-setting/services/user-setting.service';
import { UserTokenService } from 'src/user-token/services/user-token.service';
import { FindManyOptions, getManager, In } from 'typeorm';

import { ChangeNetworkInput } from '../dtos/change-network-input.dto';
import { CheckAddressInput } from '../dtos/check-address-input.dto';
import { CheckSufficientFundOutput } from '../dtos/check-sufficient-funds-output.dto';
import { CreateUserWalletInput } from '../dtos/create-user-wallet-input.dto';
import { GetBalanceInput } from '../dtos/get-balance-input.dto';
import { GetBalanceOutput } from '../dtos/get-balance-output.dto';
import { UserWalletOutput } from '../dtos/user-wallet-output.dto';
import { UserWallet } from '../entities/user-wallet.entity';
import { UserWalletRepository } from '../repositories/user-wallet.repository';

@Injectable()
export class UserWalletService {
  constructor(
    @Inject(forwardRef(() => UserTokenService))
    private userTokenService: UserTokenService,

    private logger: AppLogger,
    private readonly userWalletRepository: UserWalletRepository,
    private readonly networkService: NetworkService,
    private blockchainService: BlockchainService,
    private defaultTokenService: DefaultTokenService,
    private coinPriceService: CoinPriceService,
    @Inject(forwardRef(() => ChatRoomService))
    private chatRoomService: ChatRoomService,
    @Inject(forwardRef(() => UserSettingService))
    private readonly userSettingService: UserSettingService,
    @Inject(forwardRef(() => MemberInRoomService))
    private readonly memberInRoomService: MemberInRoomService,
    private readonly kmsDataKeyService: KmsDataKeyService,
  ) {
    this.logger.setContext(UserWalletService.name);
  }

  async createUserWallet(
    ctx: RequestContext,
    input: CreateUserWalletInput,
  ): Promise<UserWalletOutput> {
    this.logger.log(ctx, `${this.createUserWallet.name} was called`);
    let kmsDataKeyId = null;

    if (KMS_ENABLED) {
      const kmsDataKey = await this.kmsDataKeyService.generateOrGetDataKey();

      if (kmsDataKey) {
        input.privateKey = await this.kmsDataKeyService.encrypt(
          input.privateKey,
          kmsDataKey.id,
        );
        kmsDataKeyId = kmsDataKey.id;
      }
    }

    const userWallet = plainToClass(UserWallet, {
      ...input,
      address: input.walletAddress,
      walletName: '',
      isHD: false,
      currentBlockNumber: 0,
      isExternal: input.isExternal ? true : false,
      kmsDataKeyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.logger.log(ctx, `calling ${UserWalletRepository.name}.save`);
    await this.userWalletRepository.save(userWallet);

    return plainToClass(UserWalletOutput, userWallet, {
      excludeExtraneousValues: true,
    });
  }

  async findUserWalletByPrivateKey(privateKey: string): Promise<UserWallet> {
    if (KMS_ENABLED) {
      const kmsDataKey = await this.kmsDataKeyService.generateOrGetDataKey();

      if (kmsDataKey) {
        const encryptedPrivateKey = await this.kmsDataKeyService.encrypt(
          privateKey,
          kmsDataKey.id,
        );

        console.debug('encryptedPrivateKey', encryptedPrivateKey);

        const [responseWithEncrypted, responseWithNormal] = await Promise.all([
          this.userWalletRepository.findOne({
            where: {
              privateKey: encryptedPrivateKey,
              kmsDataKeyId: kmsDataKey.id,
            },
          }),
          this.userWalletRepository.findOne({
            where: {
              privateKey,
            },
          }),
        ]);

        if (responseWithEncrypted) {
          return responseWithEncrypted;
        }

        return responseWithNormal;
      }
    }

    return this.userWalletRepository.findOne({ privateKey });
  }

  async findUserWalletByAddressAndNetworkId(
    address: string,
    networkId: number,
  ): Promise<UserWallet> {
    return this.userWalletRepository.findOne({ address, networkId });
  }

  async findUserWalletWhereAddressInListAndHasNetworkId(
    addressList: string[],
    networkId: number,
  ): Promise<UserWallet[]> {
    return this.userWalletRepository.find({
      where: {
        networkId,
        address: In(addressList),
      },
    });
  }

  async findUserWalletByAddress(address: string): Promise<UserWallet> {
    return this.userWalletRepository.findOne({
      where: {
        address,
      },
    });
  }

  async getUserWallets(
    ctx: RequestContext,
    userId: number,
    offset: number,
    limit: number,
  ): Promise<{
    wallets: UserWalletOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.getUserWallets.name} was called`);

    this.logger.log(ctx, `calling ${UserWalletRepository}.findAndCount`);
    const [users, count] = await this.userWalletRepository.findAndCount({
      where: {
        userId,
      },
      take: limit,
      skip: offset,
    });

    const walletsOutput = plainToClass(UserWalletOutput, users, {
      excludeExtraneousValues: true,
    });

    return { wallets: walletsOutput, count };
  }

  async changeNetwork(
    ctx: RequestContext,
    userId: number,
    input: ChangeNetworkInput,
  ): Promise<UserWalletOutput> {
    this.logger.log(ctx, `${this.changeNetwork.name} was called`);

    this.logger.log(ctx, `calling ${UserWalletRepository.name}.getById`);
    const userWallet = await this.userWalletRepository.getByid(input.walletId);

    this.logger.log(ctx, `calling ${NetworkService.name}.findNetworkById`);
    const network = await this.networkService.findNetworkById(input.networkId);

    if (!network) {
      throw new NotFoundException(
        `Network with id ${input.networkId} not found`,
      );
    }

    userWallet.networkId = input.networkId;
    userWallet.updatedAt = new Date();

    this.logger.log(ctx, `calling ${UserWalletRepository.name}.save`);
    await this.userWalletRepository.save(userWallet);

    return plainToClass(UserWalletOutput, userWallet, {
      excludeExtraneousValues: true,
    });
  }

  async getBalance(
    ctx: RequestContext,
    userId: number,
    input: GetBalanceInput,
  ): Promise<GetBalanceOutput[]> {
    this.logger.log(ctx, `calling ${this.getBalance.name}`);

    const userWallet = await this.userWalletRepository.getByid(
      input.userWalletId,
    );
    if (!userWallet) {
      throw new NotFoundException('wallet not found');
    }

    const network = await this.networkService.findNetworkById(input.networkId);
    if (!network) {
      throw new Error('Network not found');
    }
    const providerUrl = network.rpcEndpoint;

    const defaultTokenList =
      await this.defaultTokenService.getdefaultTokenList();
    const defaultToken = defaultTokenList.find(
      (x) =>
        x.tokenSymbol.toLowerCase() == network.nativeTokenSymbol.toLowerCase(),
    );

    const userTokenList =
      await this.userTokenService.getTokenListByUserIdAndnetworkId(
        userId,
        input.networkId,
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
      const networkName = this.userTokenService.getNetworkName(
        +network.chainId,
      );
      const contractAbi = await this.userTokenService.getTokenAbi(
        defaultToken.tokenAddress,
        networkName,
      );
      let abi = '';
      if (contractAbi.length > 0) {
        abi = JSON.stringify(contractAbi);
      }
      const newToken = {
        userId: userId,
        networkId: input.networkId,
        tokenName: defaultToken.tokenName,
        tokenSymbol: defaultToken.tokenSymbol,
        tokenAddress: defaultToken.tokenAddress,
        tokenDecimal: defaultToken.tokenDecimal,
        idEnabled: true,
        logo: defaultToken.logo,
        abi: abi,
      };
      const newTokenCreated = await this.userTokenService.addNewUserToken(
        newToken,
      );
      userTokenList.push(newTokenCreated);
    }

    const tokenSymbolList = [];
    userTokenList.forEach((e) => {
      tokenSymbolList.push(e.tokenSymbol.toLowerCase());
    });
    const tokenListInfo = await this.coinPriceService.getTokenInfoForGetBalance(
      tokenSymbolList,
    );

    const userWalletOutput: GetBalanceOutput[] = [];
    const seenAddresses = new Set();
    const dataPromise = [];
    for (let i = 0; i < userTokenList.length; i++) {
      const tokenAddress = userTokenList[i].tokenAddress;
      if (seenAddresses.has(tokenAddress)) {
        continue;
      }
      seenAddresses.add(tokenAddress);

      const item: any = {
        userTokenId: userTokenList[i].id,
        tokenName: userTokenList[i].tokenName,
        tokenAddress: userTokenList[i].tokenAddress,
        tokenSymbol: userTokenList[i].tokenSymbol,
        logo: userTokenList[i].logo,
        tokenDecimal: userTokenList[i].tokenDecimal,
      };
      userWalletOutput.push(item);

      dataPromise.push(
        this.blockchainService.getBalanceToken(
          userWallet.address,
          userTokenList[i].tokenAddress,
          userTokenList[i].tokenDecimal,
          providerUrl,
        ),
      );
    }
    const listTokenPrice = await Promise.all(dataPromise);

    userWalletOutput.forEach((item) => {
      item.tokenBalance =
        listTokenPrice.find((x) => x.tokenAddress === item.tokenAddress)
          ?.tokenBalance || 0;
      if (tokenListInfo[item.tokenSymbol.toLowerCase()]?.current_price) {
        const usdPrice = new BigNumber(
          tokenListInfo[item.tokenSymbol.toLowerCase()]?.current_price || 0,
        )
          .multipliedBy(new BigNumber(item?.tokenBalance || 0))
          .toString();

        item.usdBalance = this.blockchainService.getFixed(
          this.blockchainService.toFixed(usdPrice),
          BALANCE_DECIMAL_PLACES,
        );
        item.usdRate = this.blockchainService.getFixed(
          this.blockchainService
            .toFixed(
              tokenListInfo[item.tokenSymbol.toLowerCase()]?.current_price,
            )
            .toString(),
          BALANCE_DECIMAL_PLACES,
        );
      } else {
        if (
          item?.tokenSymbol?.toLowerCase() ===
          NETWORK_DEFAULT_COIN.eurus.toLowerCase()
        ) {
          const usdPrice = new BigNumber(item?.tokenBalance)
            .multipliedBy(DEFAULT_FIAT_RATIO.eurus)
            .toString();
          item.usdBalance = this.blockchainService.getFixed(
            this.blockchainService.toFixed(usdPrice),
            BALANCE_DECIMAL_PLACES,
          );
          item.usdRate = DEFAULT_FIAT_RATIO.eurus.toString();
        } else {
          item.usdBalance = '';
          item.usdRate = '0';
        }
      }
    });

    // Always get default token on top
    const userWalletOutputFixed: GetBalanceOutput[] = [];
    userWalletOutput.forEach((e) => {
      if (e.tokenSymbol == network.nativeTokenSymbol)
        userWalletOutputFixed.push(e);
    });
    userWalletOutput.forEach((e) => {
      if (e.tokenSymbol != network.nativeTokenSymbol)
        userWalletOutputFixed.push(e);
    });

    return plainToClass(GetBalanceOutput, userWalletOutputFixed, {
      excludeExtraneousValues: true,
    });
  }

  async checkAddress(ctx: RequestContext, address: string): Promise<boolean> {
    this.logger.log(ctx, `${this.checkAddress.name} was called`);

    const sql = `Select * from user_wallet where lower(address) = lower('${address}')`;
    // console.log('sql_____________:', sql);
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const resultAddress = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const resultAddress = await entityManager.query(sql);

    if (!resultAddress || resultAddress.length == 0) {
      return false;
    } else {
      return true;
    }
  }

  private async isBlocking({
    userId,
    requestAddress,
    address,
  }: {
    userId: number;
    requestAddress: string;
    address: string;
  }) {
    const userWallet = await this.findUserWalletByAddress(address);
    if (userWallet) {
      const otherUserId = userWallet?.userId;
      const GET_USER_BLOCK_QUERY = `
        select id from user_block
        where (userId=${userId} and blockedWalletAddress="${address}"
        or userId=${otherUserId} and blockedWalletAddress="${requestAddress}")
        and status=1
      `;
      const response = await getManager().query(GET_USER_BLOCK_QUERY);
      return response?.length > 0;
    }
    return false;
  }

  async checkAddressInvalid(
    ctx: RequestContext,
    input: CheckAddressInput,
  ): Promise<any> {
    this.logger.log(ctx, `${this.checkAddressInvalid.name} was called`);
    const { address, requestAddress } = input;
    const userId = ctx.user.id;
    const sql = `Select * from user_wallet where lower(address) = lower('${address}')`;
    // console.log('sql_____________:', sql);
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const resultAddress = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const resultAddress = await entityManager.query(sql);

    let isvalid = await this.blockchainService.isValidAddress(address);
    const areUsersBlockingEachOther = await this.isBlocking({
      address,
      requestAddress,
      userId,
    });
    isvalid = isvalid && !areUsersBlockingEachOther;
    return {
      isExternal: !resultAddress || resultAddress.length == 0 ? true : false,
      isInValid: isvalid ? false : true,
    };
  }

  async findUserWalletByUserId(userId: number): Promise<UserWallet[]> {
    return this.userWalletRepository.find({ userId });
  }

  async findById(id: number): Promise<UserWallet> {
    return this.userWalletRepository.getByid(id);
  }

  async findByIdAndUserId(id: number, userId: number): Promise<UserWallet> {
    return await this.userWalletRepository.findOne({
      where: {
        id: id,
        userId: userId,
      },
    });
  }

  async findUserWalletByAddressAndUserId(
    address: string,
    userId: number,
  ): Promise<UserWallet> {
    const sql = `Select * 
    from user_wallet 
    where lower(address) = lower('${address}')
    and userId = ${userId}`;
    // console.log('sql_____________:', sql);
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const result = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const result = await entityManager.query(sql);

    if (!result || result.length == 0) {
      return;
    } else {
      return result[0];
    }
  }

  async getUserFromAddress(ctx: RequestContext, address: string): Promise<any> {
    this.logger.log(ctx, `${this.getUserFromAddress.name} was called`);
    const sql = `Select u.* 
    from user_wallet uw
    inner join users u on u.id = uw.userId 
    where lower(uw.address) = lower('${address}')`;
    // console.log('sql_____________:', sql);
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const users = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const users = await entityManager.query(sql);

    if (!users || users.length == 0) {
      return;
    } else {
      return users[0];
    }
  }

  async checkSufficientFund(
    ctx: RequestContext,
    type: string,
    networkId: number,
    userId: number,
    data: any,
  ): Promise<CheckSufficientFundOutput> {
    this.logger.log(ctx, `${this.checkSufficientFund.name} was called`);

    const [network, userWallet, userSetting] = await Promise.all([
      this.networkService.findNetworkById(networkId),
      this.userWalletRepository.findOne({
        where: {
          userId,
        },
      }),
      this.userSettingService.findOneByUserId(userId),
    ]);

    if (!network) {
      throw new NotFoundException('Network not found!');
    }

    if (!userSetting) {
      throw new NotFoundException('User setting not found!');
    }

    const { feeAmount } = await this.networkService.getNetworkFeeByLevel(
      networkId,
      data?.gasFeeLevel || userSetting.gasFeeLevel,
    );

    const networkDefaultToken = this.networkService.getNetworkDefaultToken(
      network.chainId,
    );

    const isEnoughBalancePayload = {
      type,
      data,
      providerUrl: network.rpcEndpoint,
      walletAddress: userWallet.address,
      contractAddress: '',
      toAddresses: [],
      feeAmount,
      networkDefaultToken,
    };

    switch (type) {
      case TRANSACTION_TYPES.ADD_MEMBERS:
      case TRANSACTION_TYPES.ACCEPT_JOIN_GROUP:
      case TRANSACTION_TYPES.REMOVE_MEMBERS:
        {
          const { chatRoomId } = data;
          const chatRoom = await this.chatRoomService.findRoomById(chatRoomId);
          isEnoughBalancePayload.contractAddress = chatRoom.contractAddress;
          isEnoughBalancePayload.toAddresses = data.addresses;
        }
        break;
      case TRANSACTION_TYPES.LEAVE_ROOM:
        {
          const { chatRoomId } = data;
          const chatRoom = await this.chatRoomService.findRoomById(chatRoomId);
          isEnoughBalancePayload.contractAddress = chatRoom.contractAddress;
        }
        break;
      case TRANSACTION_TYPES.SEND_MESSAGE_TO_GROUP:
        {
          const { chatRoomId, message } = data;
          const chatRoom = await this.chatRoomService.findRoomById(chatRoomId);
          const messageLength = message.length;
          const numberOfParts = Math.ceil(messageLength / MAX_MESSAGE_LENGTH);
          const firstMessagePart = message.substring(
            0,
            Math.min(MAX_MESSAGE_LENGTH, messageLength),
          );
          isEnoughBalancePayload.contractAddress = chatRoom.contractAddress;
          isEnoughBalancePayload.data = {
            ...isEnoughBalancePayload.data,
            messageContent: firstMessagePart,
            messageId: 1,
            multiply: numberOfParts,
          };
        }
        break;
      case TRANSACTION_TYPES.SEND_MESSSAGE_TO_PEER:
        {
          const { message, chatRoomId } = data;
          const toMember = await this.memberInRoomService.findOppositeMember(
            userId,
            chatRoomId,
          );
          const messageLength = message.length;
          const numberOfParts = Math.ceil(messageLength / MAX_MESSAGE_LENGTH);
          const firstMessagePart = message.substring(
            0,
            Math.min(MAX_MESSAGE_LENGTH, messageLength),
          );
          isEnoughBalancePayload.toAddresses = [toMember.walletAddress];
          isEnoughBalancePayload.contractAddress = POLYGON.p2pContractAddress;
          isEnoughBalancePayload.data = {
            ...isEnoughBalancePayload.data,
            messageContent: firstMessagePart,
            messageId: 1,
            multiply: numberOfParts,
          };
        }
        break;
      case TRANSACTION_TYPES.CHANGE_GROUP_NAME:
        {
          const { chatRoomId } = data;
          const chatRoom = await this.chatRoomService.findRoomById(chatRoomId);
          isEnoughBalancePayload.contractAddress = chatRoom.contractAddress;
        }
        break;
      case TRANSACTION_TYPES.SEND_TOKEN:
        {
          const { tokenId, amount, toAddress } = data;
          const token = await this.userTokenService.findById(tokenId);
          isEnoughBalancePayload.contractAddress = token.tokenAddress;
          isEnoughBalancePayload.toAddresses = [toAddress];
          isEnoughBalancePayload.data = {
            ...isEnoughBalancePayload.data,
            amount,
            tokenSymbol: token.tokenSymbol,
            tokenDecimal: token.tokenDecimal,
          };
        }
        break;
      default:
        this.logger.error(ctx, `${type} is not supported`);
    }

    const isFundSufficientReponse =
      await this.blockchainService.isEnoughBalance(isEnoughBalancePayload);

    return isFundSufficientReponse;
  }

  async findList(options: FindManyOptions): Promise<Partial<UserWallet>[]> {
    return this.userWalletRepository.find(options);
  }
}
