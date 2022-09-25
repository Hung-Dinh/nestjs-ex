import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { Queue } from 'bull';
import { plainToClass } from 'class-transformer';
import { BlockchainTx } from 'src/blockchain-tx/entities/blockchain-tx.entity';
import { BlockchainTxService } from 'src/blockchain-tx/services/blockchain-tx.service';
import { FileService } from 'src/file/services/file.service';
import { CoinPriceService } from 'src/jobs/services/coin-price.service';
import { MemberInRoomService } from 'src/member-in-room/services/member-in-room.service';
import { Message } from 'src/message/entities/message.entity';
import { MessageService } from 'src/message/services/message.service';
import { NetworkService } from 'src/network/services/network.service';
import { BlockchainService } from 'src/shared/blockchain-service/blockchain-service.service';
import {
  BALANCE_DECIMAL_PLACES,
  BLOCKCHAIN_TX_STATUS,
  BLOCKCHAINTX_REFTABLE,
  HISTORY_TITLE,
  JOB_OPTIONS,
  MESSAGE_STATUS,
  MESSAGE_TYPE,
} from 'src/shared/constants';
import { QUEUE_JOB, QUEUE_NAME } from 'src/shared/constants/queue.constant';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { BigNumberTool } from 'src/shared/tools/big-number.tool';
import { UserService } from 'src/user/services/user.service';
import { UserContactService } from 'src/user-contact/services/user-contact.service';
import { UserTokenService } from 'src/user-token/services/user-token.service';
import { UserWalletService } from 'src/user-wallet/services/user-wallet.service';
import { getManager, In } from 'typeorm';

import { UserToken } from '../../user-token/entities/user-token.entity';
import {
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from '../constants/transaction.constant';
import { GetTokenTransactionDto } from '../dtos/get-token-transactions.dto';
import { HistoryDetailOutput } from '../dtos/history-detail-output.dto';
import { HistoryListOutput } from '../dtos/history-list-output.dto';
import { RecentTransactionOutput } from '../dtos/recent-transaction-output.dto';
import { SendTokenInput } from '../dtos/send-token-input.dto';
import { TransactionOutput } from '../dtos/transaction-output.dto';
import { Transaction } from '../entities/transaction.entity';
import { TransactionRepository } from '../repositories/transaction.repository';


@Injectable()
export class TransactionService {
  constructor(
    private logger: AppLogger,
    private userService: UserService,
    private networkService: NetworkService,
    private userTokenService: UserTokenService,
    @Inject(forwardRef(() => UserWalletService))
    private userWalletService: UserWalletService,
    private userContactService: UserContactService,
    private blockchainTxService: BlockchainTxService,
    private readonly coinPriceService: CoinPriceService,
    private transactionRepository: TransactionRepository,
    private blockchainService: BlockchainService,
    @InjectQueue(QUEUE_NAME.WALLET)
    private readonly walletQueue: Queue,
    @Inject(forwardRef(() => MessageService))
    private readonly messageService: MessageService,
    @Inject(forwardRef(() => MemberInRoomService))
    private readonly memberInRoomService: MemberInRoomService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
  ) {
    this.logger.setContext(TransactionService.name);
  }

  calcRawAmountOfTransaction(amount: string, tokenDecimal: number): string {
    return BigNumberTool.toMultiplyBigNumber(
      amount,
      BigNumberTool.toPower(10, tokenDecimal),
    ).toString();
  }

  calcAmountOfTransaction(rawAmount: string, tokenDecimal: number): string {
    return BigNumberTool.toDevideBigNumber(
      rawAmount,
      BigNumberTool.toPower(10, tokenDecimal),
    ).toString();
  }

  async getTransactionByWalletAddressAndTokenAddressAndNetworkId(
    walletAddress: string,
    tokenAddress: string,
    networkId: number,
    limit: number,
    offset: number,
  ): Promise<{
    transactions: Transaction[];
    count: number;
  }> {
    const [transactions, count] = await this.transactionRepository.findAndCount(
      {
        where: [
          {
            fromAddress: walletAddress,
            tokenAddress,
            networkId,
          },
          {
            toAddress: walletAddress,
            tokenAddress,
            networkId,
            transactionStatus: In([
              TRANSACTION_STATUS.COMPLETED,
              TRANSACTION_STATUS.SUCCESS,
            ]),
          },
        ],
        take: limit,
        skip: offset,
        order: {
          updatedAt: 'DESC',
        },
      },
    );

    return {
      transactions,
      count,
    };
  }

  async mergeTransactionWithBlockchainTx(
    transaction: Transaction,
    blockchainTx: BlockchainTx,
    userTokens: UserToken[],
    refId: number,
    refTable: string,
    walletAddress: string,
  ): Promise<TransactionOutput> {
    const { feeAmount = 0, feeSymbol = '' } = blockchainTx || {};

    const token = userTokens.find(
      (token) => token.tokenAddress === transaction.tokenAddress,
    );

    const amount = this.calcAmountOfTransaction(
      transaction.amount,
      token?.tokenDecimal || 18,
    );

    const [feeInUsd, amountInUsd] = await Promise.all([
      this.coinPriceService.calcTokenPriceInUsd(feeSymbol, feeAmount + ''),
      this.coinPriceService.calcTokenPriceInUsd(
        transaction.tokenSymbol,
        amount,
      ),
    ]);

    let total = new BigNumber(amount);
    let totalInUsd = new BigNumber(amountInUsd);

    if (feeSymbol === transaction.tokenSymbol) {
      total = total.plus(feeAmount);
      totalInUsd = totalInUsd.plus(feeInUsd);
    }

    let title = HISTORY_TITLE.SEND;
    let transactionType = transaction.type;

    switch (transactionType) {
      case TRANSACTION_TYPE.DEPOSIT:
        title = HISTORY_TITLE.RECIVE;
        break;
      case TRANSACTION_TYPE.WITHDRAW:
        {
          if (transaction.toAddress === walletAddress) {
            // with withdraw transaction, toAddress with be receiver -> title = Recived and type is deposit
            transactionType = TRANSACTION_TYPE.DEPOSIT;
            title = HISTORY_TITLE.RECIVE;
          } else {
            title = HISTORY_TITLE.SEND;
          }
        }
        break;
      case TRANSACTION_TYPE.WITHDRAW_RED_PACKET:
        {
          if (transaction.toAddress === walletAddress) {
            // with withdraw_red_packet transaction, toAddress with be receiver -> title = Recived and type is deposit
            transactionType = TRANSACTION_TYPE.DEPOSIT;
            title = HISTORY_TITLE.RECIVE;
          } else {
            title = HISTORY_TITLE.SEND_RED_PACKET;
          }
        }
        break;
      default:
        title = HISTORY_TITLE.SEND;
    }

    let titleKey: string;
    Object.keys(HISTORY_TITLE).forEach((key) => {
      if (HISTORY_TITLE[key] == title) titleKey = key;
    });

    return plainToClass(
      TransactionOutput,
      {
        ...transaction,
        type: transactionType,
        feeInUsd,
        amountInUsd,
        totalInUsd: BigNumberTool.formatNumber(totalInUsd.toNumber(), 18),
        feeSymbol,
        feeAmount,
        total: BigNumberTool.formatNumber(total.toNumber(), 18),
        tokenSymbol: transaction.tokenSymbol,
        amount: BigNumberTool.formatNumber(
          new BigNumber(amount).toNumber(),
          18,
        ),
        refId,
        refTable,
        title,
        titleKey,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  getRefIdAndRefTable(
    transaction: Transaction,
    messages: Message[],
  ): {
    refId: number;
    refTable: string;
  } {
    const message = messages.find((message) => {
      return (
        message?.transactionId && +message.transactionId === +transaction.id
      );
    });

    return {
      refId: !!message ? message.id : transaction.id,
      refTable: !!message ? 'message' : 'transaction',
    };
  }

  async getTransactionOutput(
    transactions: Transaction[],
    messages: Message[],
    walletAddress: string,
  ): Promise<TransactionOutput[]> {
    const tokenAddresses = transactions
      .map((transaction) => transaction.tokenAddress)
      .filter(Boolean);

    const uniqueTokenAddress = [...new Set(tokenAddresses)];
    const userTokens = await this.userTokenService.getTokensByTokenAddresses(
      uniqueTokenAddress,
    );

    const refIdAndRefTableList = transactions.map((transaction) => {
      return this.getRefIdAndRefTable(transaction, messages);
    });

    const blockchainTxList =
      await this.blockchainTxService.getBlockchainTxByRefIdAndRefTableList(
        refIdAndRefTableList,
      );

    return Promise.all(
      transactions.map(async (transaction) => {
        const { refId, refTable } = this.getRefIdAndRefTable(
          transaction,
          messages,
        );

        const blockchainTx = blockchainTxList.find((tx) => {
          return +tx.refId === +refId && tx.refTable === refTable;
        });

        return this.mergeTransactionWithBlockchainTx(
          transaction,
          blockchainTx,
          userTokens,
          refId,
          refTable,
          walletAddress,
        );
      }),
    );
  }

  /**
   *  !!! Deprecated
   */
  async getTransactionsByUserWallet(
    ctx: RequestContext,
    walletId: number,
    limit: number,
    offset: number,
  ): Promise<{ transactions: TransactionOutput[]; count: number }> {
    // this.logger.log(ctx, `${this.getTransactionsByUserWallet.name} was called`);

    // const [transactions, count] = await this.transactionRepository.findAndCount(
    //   {
    //     where: {
    //       userWalletId: walletId,
    //     },
    //     take: limit,
    //     skip: offset,
    //     order: {
    //       createdAt: 'DESC',
    //     },
    //   },
    // );

    // const transctionsOutput = await this.getTransactionOutput(transactions, []);

    return {
      transactions: [],
      count: 0,
    };
  }

  async sendTokenTransaction(
    ctx: RequestContext,
    userId: number,
    input: SendTokenInput,
  ): Promise<TransactionOutput> {
    this.logger.log(ctx, `${this.sendTokenTransaction.name} was called`);

    const userWallet =
      await this.userWalletService.findUserWalletByAddressAndUserId(
        input.fromAddress,
        userId,
      );

    if (!userWallet) {
      throw new NotFoundException('User wallet not found');
    }

    const [inputNetwork, userNetwork] = await Promise.all([
      this.networkService.findNetworkById(input.networkId),
      this.networkService.findNetworkById(userWallet.networkId),
    ]);

    if (!inputNetwork) {
      throw new BadRequestException('Input network is not valid');
    }

    if (!userNetwork) {
      throw new BadRequestException('User network is not valid');
    }

    const canSendTokenToNetwork = await this.networkService.isSharedNetworks(
      userWallet.networkId,
      input.networkId,
    );

    if (!canSendTokenToNetwork) {
      throw new BadRequestException(
        `Your wallet address can not send token to ${inputNetwork.name} network`,
      );
    }

    const checkValidtoAddress = await this.blockchainService.isValidAddress(
      input.toAddress,
    );
    if (!checkValidtoAddress) {
      throw new Error('Invalid inbound address');
    }

    const token = await this.userTokenService.getTokenById(input.tokenId);
    if (!token) {
      throw new NotFoundException('Token not found');
    }

    const { feeSymbol, feeAmount } =
      await this.networkService.getNetworkFeeByLevel(
        input.networkId,
        input.feeLevel,
      );

    const newTransaction = plainToClass(Transaction, {
      ...input,
      userId,
      userWalletId: userWallet.id,
      memoCode: null,
      txHash: null,
      blockchainTxId: null,
      transactionStatus: TRANSACTION_STATUS.PENDING,
      type: TRANSACTION_TYPE.WITHDRAW,
      amount: this.calcRawAmountOfTransaction(input.amount, token.tokenDecimal),
      tokenSymbol: token.tokenSymbol,
      tokenAddress: token.tokenAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const newTransactionDb = await this.transactionRepository.save(
      newTransaction,
    );

    await this.walletQueue.add(
      QUEUE_JOB.WALLET.TRANSACTION,
      {
        transactionId: newTransactionDb.id,
        tokenId: input.tokenId,
        feeAmount: feeAmount,
        feeSymbol: feeSymbol,
        amount: input.amount,
        tokenDecimal: token?.tokenDecimal || 18,
      },
      JOB_OPTIONS,
    );

    return new Promise((resolve) => {
      resolve(
        plainToClass(
          TransactionOutput,
          { ...newTransactionDb, amount: input.amount },
          {
            excludeExtraneousValues: true,
          },
        ),
      );
    });
  }

  async getRecentSentTransactionReceivers(
    ctx: RequestContext,
    userId: number,
    networkId: number,
  ): Promise<RecentTransactionOutput[]> {
    this.logger.log(
      ctx,
      `${this.getRecentSentTransactionReceivers.name} was called`,
    );

    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const recentTransactionsDistinctedByToAddress =
    //   await slaveQueryRunner.query(`
    //   select toAddress, max(createdAt) as createTime from transaction
    //   where userId = ${userId} and networkId = ${networkId} and type = "${TRANSACTION_TYPE.DEPOSIT}"
    //   group by toAddress
    //   order by createTime desc
    //   limit 3;
    // `);

    const entityManager = getManager();

    const recentTransactionsDistinctedByToAddress = await entityManager.query(`
    select sub.toAddress as address, 
    ifnull(uc.avatar, u.avatar) as avatar,
    ifnull(uc.name, u.name) as name
    from (select toAddress, max(createdAt) as createTime from transaction
        where userId = ${userId} and networkId = ${networkId} and type = '${TRANSACTION_TYPE.WITHDRAW}'
        group by toAddress
        order by createTime desc
        limit 3) sub
    left outer join user_contact uc on lower(uc.address) = lower(sub.toAddress) and uc.userId = ${userId}
    left outer join user_wallet uw on lower(uw.address) = lower(sub.toAddress)
    left outer join users u on u.id = uw.userId
    `);

    if (
      !recentTransactionsDistinctedByToAddress ||
      !recentTransactionsDistinctedByToAddress.length
    ) {
      return [];
    }
   
    // const recentTransactionsReceiversAddress =
    //   recentTransactionsDistinctedByToAddress.map(
    //     (transaction: Partial<Transaction>) => transaction.toAddress,
    //   );
    // const receiversWallet =
    //   await this.userWalletService.findUserWalletWhereAddressInListAndHasNetworkId(
    //     recentTransactionsReceiversAddress as string[],
    //     networkId,
    //   );
    // const receiversId = receiversWallet?.map((wallet) => Number(wallet.userId));
    // const receiversInfo = await this.userService.getUsersWhereIdInIds(
    //   receiversId,
    // );

    // const userContacts =
    //   await this.userContactService.findUserContactsByAddressList(
    //     userId,
    //     recentTransactionsReceiversAddress,
    //   );

    // const recentReceiversOutput = await Promise.all(
    //   receiversInfo.map(async (user) => {
    //     const address = receiversWallet.find(
    //       (wallet) => +wallet?.userId === +user?.id,
    //     )?.address;
    //     const contact = userContacts.find(
    //       (contact) => contact?.address === address,
    //     );

    //     let avatar = '';
    //     if (user?.avatar && NumberTool.isStringNumber(user.avatar)) {
    //       avatar = await this.fileService.getFileUrl(+user.avatar);
    //     }

    //     return {
    //       address,
    //       name: user.name,
    //       avatar,
    //       ...(contact ? { nickname: contact.name } : {}),
    //     };
    //   }),
    // );

    return plainToClass(
      RecentTransactionOutput,
      <any[]>recentTransactionsDistinctedByToAddress,
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async getTransactionsWhereIdInIds(ids: number[]): Promise<Transaction[]> {
    return this.transactionRepository.findByIds(ids);
  }

  async getTransactionsByTokenAddress(
    tokenAddress: string,
    networkId: number,
    offset: number,
    limit: number,
  ): Promise<{
    transactions: Transaction[];
    count: number;
  }> {
    const [transactions, count] = await this.transactionRepository.findAndCount(
      {
        where: {
          tokenAddress,
          networkId,
        },
        take: limit,
        skip: offset,
        order: {
          createdAt: 'DESC',
        },
      },
    );

    return {
      transactions,
      count,
    };
  }

  async getTokenTransactions(
    ctx: RequestContext,
    input: GetTokenTransactionDto,
  ): Promise<{
    transactions: TransactionOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.getTokenTransactions.name} was called`);

    const { limit, networkId, offset, tokenId } = input;
    const [userToken, userWallets] = await Promise.all([
      this.userTokenService.findById(tokenId),
      this.userWalletService.findUserWalletByUserId(ctx.user.id),
    ]);

    if (!userWallets?.length) {
      throw new Error('User has no wallet');
    }

    const walletAddress = userWallets[0].address;

    const { transactions, count } =
      await this.getTransactionByWalletAddressAndTokenAddressAndNetworkId(
        walletAddress,
        userToken.tokenAddress,
        networkId,
        limit,
        offset,
      );

    const redPacketTransactions = transactions.filter(
      (transaction: Transaction) =>
        transaction.type === TRANSACTION_TYPE.WITHDRAW_RED_PACKET,
    );
    const redPacketTransactionIds = redPacketTransactions.map(
      (transaction: Transaction) => transaction.id,
    );

    const messages = await this.messageService.findMessagesByTransactionIds(
      redPacketTransactionIds,
    );

    const transactionsOutput = await this.getTransactionOutput(
      transactions,
      messages,
      walletAddress,
    );

    return {
      transactions: transactionsOutput.filter(Boolean),
      count,
    };
  }

  async getMesssageAndTransactionHistory(
    ctx: RequestContext,
    userId: number,
    networkId: number,
    limit: number,
    offset: number,
  ): Promise<HistoryListOutput[]> {
    this.logger.log(
      ctx,
      `${this.getMesssageAndTransactionHistory.name} was called`,
    );
    const network = await this.networkService.findNetworkById(networkId);
    if (!network) {
      throw new Error('network not found');
    }
    const sql = `select sub.* 
    from
    (select ( case when transactionStatus = '${TRANSACTION_STATUS.PENDING}' then '${MESSAGE_STATUS.IN_PROGRESS}'
                  when transactionStatus = '${TRANSACTION_STATUS.SENT}' then '${MESSAGE_STATUS.IN_PROGRESS}'
                  when transactionStatus = '${TRANSACTION_STATUS.SUCCESS}' then '${MESSAGE_STATUS.COMPLETED}'
                  when transactionStatus = '${TRANSACTION_STATUS.COMPLETED}' then '${MESSAGE_STATUS.COMPLETED}'
                  when transactionStatus = '${TRANSACTION_STATUS.FAILED}' then '${MESSAGE_STATUS.FAILED}'
                  when transactionStatus = '${TRANSACTION_STATUS.RETRYING}' then '${MESSAGE_STATUS.IN_PROGRESS}'
                  when transactionStatus = '${TRANSACTION_STATUS.PENDING_RETRY}' then '${MESSAGE_STATUS.IN_PROGRESS}'
             end 
            ) as status, 
    amount, 
    tokenSymbol, 
    tokenAddress, 
    createdAt, 
    if(type = '${TRANSACTION_TYPE.DEPOSIT}', '${HISTORY_TITLE.RECIVE}', '${HISTORY_TITLE.SEND}') as title, 
    '${BLOCKCHAINTX_REFTABLE.TRANSACTION}' as type,
    id as refId
    from transaction
    where userId = ${userId}
    and networkId = ${networkId}
    and (select m2.id from messages m2 where m2.transactionId = transaction.id limit 1) is null
    UNION
    select  (  case when transactionStatus = '${TRANSACTION_STATUS.SUCCESS}' then '${MESSAGE_STATUS.COMPLETED}'
                    when transactionStatus = '${TRANSACTION_STATUS.COMPLETED}' then '${MESSAGE_STATUS.COMPLETED}'
               end 
            ) as status, 
    amount, 
    tokenSymbol, 
    tokenAddress, 
    createdAt, 
    '${HISTORY_TITLE.RECIVE}' as title,
    '${BLOCKCHAINTX_REFTABLE.TRANSACTION}' as type,
    id as refId
    from transaction
    where lower(toAddress) in (select lower(address) from user_wallet where userId = ${userId})
    and (transactionStatus = '${TRANSACTION_STATUS.COMPLETED}' or transactionStatus = '${TRANSACTION_STATUS.SUCCESS}')
    and userId != ${userId}
    and networkId = ${networkId}
    UNION 
    select distinct 
    if(
      m.status = '${MESSAGE_STATUS.HIDDEN}',
      if(
        b.txStatus = '${BLOCKCHAIN_TX_STATUS.VERIFIED}', 
        '${MESSAGE_STATUS.COMPLETED}',
        '${MESSAGE_STATUS.FAILED}'
        ),
      m.status
    ) as status,  
    b.amount,
    n.nativeTokenSymbol as tokenSymbol,
    null as tokenAddress,
    m.createdAt,  
    (case when m.type = '${MESSAGE_TYPE.TEXT}' then '${HISTORY_TITLE.SEND_MESSAGE}'
          when m.type = '${MESSAGE_TYPE.ATTACHMENTS}' then '${HISTORY_TITLE.SEND_MULTIMEDIA}'
          when m.type = '${MESSAGE_TYPE.IMAGE}' then '${HISTORY_TITLE.SEND_MULTIMEDIA}'
          when m.type = '${MESSAGE_TYPE.VIDEO}' then '${HISTORY_TITLE.SEND_MULTIMEDIA}'
          when m.type = '${MESSAGE_TYPE.VOICE_RECORD}' then '${HISTORY_TITLE.SEND_MULTIMEDIA}'
          when m.type = '${MESSAGE_TYPE.FILE}' then '${HISTORY_TITLE.SEND_MULTIMEDIA}'
          when m.type = '${MESSAGE_TYPE.SEND_TOKEN}' then '${HISTORY_TITLE.SEND_RED_PACKET}'
          when m.type = '${MESSAGE_TYPE.ROOM_NOTIFICATION}' then 
            ( case  when rnt.type = '${QUEUE_JOB.CHAT.ACCEPT_JOIN_GROUP}' then '${HISTORY_TITLE.ADD_MEMBER}'
                    when rnt.type = '${QUEUE_JOB.CHAT.REMOVE_MEMBERS}' then '${HISTORY_TITLE.REMOVE_MEMBER}'
                    when rnt.type = '${QUEUE_JOB.CHAT.LEAVE_ROOM}' then '${HISTORY_TITLE.LEAVE_GROUP}'
                    when rnt.type = '${QUEUE_JOB.CHAT.REMOVE_ADMIN}' then '${HISTORY_TITLE.REMOVE_ADMIN}'
                    when rnt.type = '${QUEUE_JOB.CHAT.SET_ADMIN}' then '${HISTORY_TITLE.SET_ADMIN}'
              end)
          when m.type = '${MESSAGE_TYPE.ROOM_ACTION}' then 
            ( case  when rat.type = '${QUEUE_JOB.CHAT.CREATE_GROUP_CHAT}' then '${HISTORY_TITLE.CREATE_GROUP_CHAT}'
                    when rat.type = '${QUEUE_JOB.CHAT.CHANGE_GROUP_NAME}' then '${HISTORY_TITLE.CHANGE_GROUP_NAME}'
              end)                                       
      end
    ) as title,
    '${BLOCKCHAINTX_REFTABLE.MESSAGE}' as type,
    m.id as refId
    from messages m
    inner join chat_room cr on cr.id = m.chatRoomId
    inner join network n on n.id = cr.networkId 
    left outer join (select refId, 
                     refTable, 
                     max(feeSymbol) as feeSymbol,
                     max(txStatus) as txStatus, 
                     sum( cast(feeAmount as DECIMAL(10,6))) as amount
                     from blockchainTx 
                     group by refId, refTable        
                    ) b on b.refId = m.id and b.refTable =  '${BLOCKCHAINTX_REFTABLE.MESSAGE}'
    left outer join room_action_tx rat on rat.messageId = m.id
    left outer join room_notification_tx rnt on rnt.messageId = m.id
    where userId = ${userId}
    and cr.networkId = ${networkId}
    ) as sub
    where sub.title is not null
    order by sub.createdAt desc
    limit ${limit}
    offset ${offset}`;

    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const histories = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const histories = await entityManager.query(sql);

    // tranform amount to decimal for transaction history
    const tokenList = await this.userTokenService.getAllTokenFromNetwork(
      networkId,
    );
    histories.forEach((e) => {
      // chuyển trạng thái messageStatus : pending_retry, retrying  thành in_progress
      if (
        e.status == MESSAGE_STATUS.PENDING_RETRY ||
        e.status == MESSAGE_STATUS.RETRYING
      ) {
        e.status = MESSAGE_STATUS.IN_PROGRESS;
      }

      // chuyển amount thành thập phân
      if (e.type == BLOCKCHAINTX_REFTABLE.TRANSACTION) {
        const token = tokenList.find(
          (x) => x.tokenSymbol.toLowerCase() == e.tokenSymbol?.toLowerCase(),
        );
        if (token) {
          e.amount = this.blockchainService
            .formatPoint(e.amount, token.tokenDecimal)
            .toString();
        } else {
          e.amount = '';
        }
      }

      // thêm titleKey
      Object.keys(HISTORY_TITLE).forEach((key) => {
        if (HISTORY_TITLE[key] == e.title) e.titleKey = key;
      });
    });

    return plainToClass(HistoryListOutput, <any[]>histories, {
      excludeExtraneousValues: true,
    });
  }

  private convertToUSD(usePrice: any, amount: number) {
    const usdPrice = new BigNumber(usePrice)
      .multipliedBy(new BigNumber(amount || 0))
      .toString();

    return this.blockchainService.getFixed(
      this.blockchainService.toFixed(usdPrice),
      BALANCE_DECIMAL_PLACES,
    );
  }

  async getDetailMesssageAndTransactionHistory(
    ctx: RequestContext,
    userId: number,
    refId: number,
    type: string,
    title: string,
  ): Promise<HistoryDetailOutput> {
    this.logger.log(
      ctx,
      `${this.getDetailMesssageAndTransactionHistory.name} was called`,
    );

    if (!BLOCKCHAINTX_REFTABLE[type.toUpperCase()]) {
      throw new Error('type not valid');
    }

    // let checkTitle = false;
    // Object.keys(HISTORY_TITLE).forEach((key) => {
    //   if (HISTORY_TITLE[key] == title) checkTitle = true;
    // });
    // if (!checkTitle) {
    //   throw new Error('title not valid');
    // }

    // transform to new design title
    // if(title == HISTORY_TITLE.SENT) title = HISTORY_TITLE.SEND;
    // if(title == HISTORY_TITLE.RECIVED) title = HISTORY_TITLE.RECIVE;

    // get querry sql for detail
    let sql = ``;
    if (type == BLOCKCHAINTX_REFTABLE.TRANSACTION) {
      const transaction = await this.transactionRepository.findOne(refId);
      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }
      let isSent = false;
      if (
        transaction.userId == userId &&
        transaction.type != TRANSACTION_TYPE.DEPOSIT
      ) {
        isSent = true;
      }
      sql = this.getTransactionHistoryDetailSQL(refId, isSent, userId);
    } else if (type == BLOCKCHAINTX_REFTABLE.MESSAGE) {
      const messsage = await this.getMessageInfoById(refId);
      if (!messsage) {
        throw new NotFoundException('Message not found');
      }
      console.log('messsage: ', messsage);
      sql = this.getMessageHistoryDetailSQL(messsage, userId);
    }

    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const historyDetails = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const historyDetails = await entityManager.query(sql);

    // console.log(historyDetails);
    if (!historyDetails || !historyDetails.length) {
      throw new NotFoundException('History Detail not found');
    }
    const historyDetail = historyDetails[0];

    // chuyển trạng thái messageStatus : pending_retry, retrying  thành in_progress
    if (
      historyDetail.status == MESSAGE_STATUS.PENDING_RETRY ||
      historyDetail.status == MESSAGE_STATUS.RETRYING
    ) {
      historyDetail.status = MESSAGE_STATUS.IN_PROGRESS;
    }

    // tranform amount to decimal for transaction history
    const tokenList = await this.userTokenService.getAllTokenFromNetwork(
      historyDetail.networkId,
    );
    const token = tokenList.find(
      (x) =>
        x.tokenSymbol.toLowerCase() == historyDetail.tokenSymbol?.toLowerCase(),
    );
    if (token && historyDetail.amount) {
      historyDetail.amount = this.blockchainService
        .formatPoint(historyDetail.amount, token.tokenDecimal)
        .toString();
    }

    // thêm titleKey
    Object.keys(HISTORY_TITLE).forEach((key) => {
      if (HISTORY_TITLE[key] == historyDetail.title)
        historyDetail.titleKey = key;
    });

    //get usd price
    const tokenSymbolList = [];
    if (historyDetail.tokenSymbol)
      tokenSymbolList.push(historyDetail.tokenSymbol.toLowerCase());
    if (historyDetail.feeSymbol)
      tokenSymbolList.push(historyDetail.feeSymbol.toLowerCase());
    if (tokenSymbolList.length > 0) {
      const tokenListInfo =
        await this.coinPriceService.getTokenInfoForGetBalance(tokenSymbolList);
      if (
        historyDetail.tokenSymbol &&
        historyDetail.amount &&
        tokenListInfo[historyDetail.tokenSymbol.toLowerCase()] &&
        tokenListInfo[historyDetail.tokenSymbol.toLowerCase()].current_price
      ) {
        historyDetail.amountInUSD = this.convertToUSD(
          tokenListInfo[historyDetail.tokenSymbol.toLowerCase()].current_price,
          historyDetail.amount,
        );
      }
      if (
        historyDetail.feeSymbol &&
        historyDetail.feeAmount &&
        tokenListInfo[historyDetail.feeSymbol.toLowerCase()] &&
        tokenListInfo[historyDetail.feeSymbol.toLowerCase()].current_price
      ) {
        historyDetail.feeAmountInUSD = this.convertToUSD(
          tokenListInfo[historyDetail.feeSymbol.toLowerCase()].current_price,
          historyDetail.feeAmount,
        );
      }
    }

    // get listTransactionHash
    if (historyDetail.transactionHashes) {
      historyDetail.listTransactionHash =
        historyDetail.transactionHashes.split(',');
    } else {
      historyDetail.listTransactionHash = [];
    }

    return plainToClass(HistoryDetailOutput, <any>historyDetail, {
      excludeExtraneousValues: true,
    });
  }

  getTransactionHistoryDetailSQL(
    transactionId: number,
    isSent: boolean,
    userId: number,
  ) {
    if (isSent) {
      return `select distinct
      t.fromAddress, 
      t.toAddress , 
      t.amount, 
      t.tokenAddress,
      t.tokenSymbol, 
      n.rpcEndpoint, 
      n.nativeTokenSymbol as feeSymbol,
      b.feeAmount,
      ( case when transactionStatus = '${TRANSACTION_STATUS.PENDING}' then '${MESSAGE_STATUS.IN_PROGRESS}'
                  when transactionStatus = '${TRANSACTION_STATUS.SENT}' then '${MESSAGE_STATUS.IN_PROGRESS}'
                  when transactionStatus = '${TRANSACTION_STATUS.SUCCESS}' then '${MESSAGE_STATUS.COMPLETED}'
                  when transactionStatus = '${TRANSACTION_STATUS.COMPLETED}' then '${MESSAGE_STATUS.COMPLETED}'
                  when transactionStatus = '${TRANSACTION_STATUS.FAILED}' then '${MESSAGE_STATUS.FAILED}'
                  when transactionStatus = '${TRANSACTION_STATUS.RETRYING}' then '${MESSAGE_STATUS.IN_PROGRESS}'
                  when transactionStatus = '${TRANSACTION_STATUS.PENDING_RETRY}' then '${MESSAGE_STATUS.IN_PROGRESS}'
        end 
      ) as status, 
      '${HISTORY_TITLE.SEND}' as title,
      t.createdAt,
      if(ifnull(uc.name, u.name) is null, null, Concat('To ', ifnull(uc.name, u.name))) as detail,
      ifnull(t.txHash, b.txHash) as transactionHashes,
      t.networkId
      from transaction t
      inner join network n on n.id = t.networkId
      left join blockchainTx b on b.id = t.blockchainTxId 
      left join user_contact uc on uc.userId = ${userId} and lower(uc.address) = lower(t.toAddress)
      left join user_wallet uw on lower(uw.address) = lower(t.toAddress)
      left join users u on u.id = uw.userId 
      where t.id = ${transactionId}`;
    } else {
      return `select distinct
      t.fromAddress, 
      t.toAddress , 
      t.amount, 
      t.tokenAddress,
      t.tokenSymbol, 
      n.rpcEndpoint, 
      n.nativeTokenSymbol as feeSymbol,
      b.feeAmount,
      ( case when transactionStatus = '${TRANSACTION_STATUS.PENDING}' then '${MESSAGE_STATUS.IN_PROGRESS}'
                  when transactionStatus = '${TRANSACTION_STATUS.SENT}' then '${MESSAGE_STATUS.IN_PROGRESS}'
                  when transactionStatus = '${TRANSACTION_STATUS.SUCCESS}' then '${MESSAGE_STATUS.COMPLETED}'
                  when transactionStatus = '${TRANSACTION_STATUS.COMPLETED}' then '${MESSAGE_STATUS.COMPLETED}'
                  when transactionStatus = '${TRANSACTION_STATUS.FAILED}' then '${MESSAGE_STATUS.FAILED}'
                  when transactionStatus = '${TRANSACTION_STATUS.RETRYING}' then '${MESSAGE_STATUS.IN_PROGRESS}'
                  when transactionStatus = '${TRANSACTION_STATUS.PENDING_RETRY}' then '${MESSAGE_STATUS.IN_PROGRESS}'
        end 
      ) as status, 
      '${HISTORY_TITLE.RECIVE}' as title,
      t.createdAt,
      if(ifnull(uc.name, u.name) is null, null, Concat('From ', ifnull(uc.name, u.name))) as detail,
      ifnull(t.txHash, b.txHash) as transactionHashes,
      t.networkId
      from transaction t
      inner join network n on n.id = t.networkId
      left join blockchainTx b on b.id = t.blockchainTxId 
      left join user_contact uc on uc.userId = ${userId} and lower(uc.address) = lower(t.fromAddress)
      left join user_wallet uw on lower(uw.address) = lower(t.fromAddress)
      left join users u on u.id = uw.userId 
      where t.id = ${transactionId}`;
    }
  }

  getMessageHistoryDetailSQL(message: any, userId: number) {
    if (message.type == MESSAGE_TYPE.SEND_TOKEN) {
      return ` select distinct 
      t.fromAddress, 
      t.toAddress , 
      t.amount, 
      t.tokenAddress,
      t.tokenSymbol, 
      n.rpcEndpoint, 
      n.nativeTokenSymbol as feeSymbol,
      b.feeAmount,
      if(
        m.status = '${MESSAGE_STATUS.HIDDEN}',
        if(
          b.txStatus = '${BLOCKCHAIN_TX_STATUS.VERIFIED}', 
          '${MESSAGE_STATUS.COMPLETED}',
          '${MESSAGE_STATUS.FAILED}'
          ),
        m.status
      ) as status,   
      b.txHash as transactionHashes,
      m.createdAt,
      if( cr.isGroup = 0, 
          concat('To ', ifnull(uc.name, u.name), ' in private chat' ),
          concat('To ', ifnull(uc.name, u.name), ' in ', cr.name )
        ) as detail,
      '${HISTORY_TITLE.SEND_RED_PACKET}' as title,
      t.networkId
      from messages m
      inner join chat_room cr on cr.id = m.chatRoomId
      inner join network n on n.id = cr.networkId
      left outer join blockchainTx b on b.refId = m.id and b.refTable = '${BLOCKCHAINTX_REFTABLE.MESSAGE}'
      left outer join transaction t on t.id = m.transactionId
      left outer join user_wallet uw on lower(uw.address) = lower(t.toAddress)
      left outer join users u on u.id = uw.userId
      left outer join user_contact uc on uc.userId = ${userId} and lower(uc.address) = lower(t.toAddress)
      where m.id = ${message.id}
      and m.type = '${MESSAGE_TYPE.SEND_TOKEN}'`;
    } else if (message.isGroup == 0) {
      return ` select distinct 
      m.walletAddress as fromAddress,
      n.rpcEndpoint,
      n.nativeTokenSymbol as feeSymbol,
      b.feeAmount,
      if(
        m.status = '${MESSAGE_STATUS.HIDDEN}',
        if(
          b.txStatus = '${BLOCKCHAIN_TX_STATUS.VERIFIED}', 
          '${MESSAGE_STATUS.COMPLETED}',
          '${MESSAGE_STATUS.FAILED}'
          ),
        m.status
      ) as status,   
      b.transactionHashes,
      m.createdAt,
      (case when m.type = '${MESSAGE_TYPE.TEXT}' then concat('To ', ifnull(uc.name, u.name))
            when m.type = '${MESSAGE_TYPE.FILE}' then concat('To ', ifnull(uc.name, u.name))
            when m.type = '${MESSAGE_TYPE.ATTACHMENTS}' then concat('To ', ifnull(uc.name, u.name))
            when m.type = '${MESSAGE_TYPE.IMAGE}' then concat('To ', ifnull(uc.name, u.name))
            when m.type = '${MESSAGE_TYPE.VIDEO}' then concat('To ', ifnull(uc.name, u.name))
            when m.type = '${MESSAGE_TYPE.VOICE_RECORD}' then concat('To ', ifnull(uc.name, u.name))
        end 
       ) as detail,
       (case when m.type = '${MESSAGE_TYPE.TEXT}' then '${HISTORY_TITLE.SEND_MESSAGE}'
          when m.type = '${MESSAGE_TYPE.FILE}' then '${HISTORY_TITLE.SEND_MULTIMEDIA}'
          when m.type = '${MESSAGE_TYPE.ATTACHMENTS}' then '${HISTORY_TITLE.SEND_MULTIMEDIA}'
          when m.type = '${MESSAGE_TYPE.IMAGE}' then '${HISTORY_TITLE.SEND_MULTIMEDIA}'
          when m.type = '${MESSAGE_TYPE.VIDEO}' then '${HISTORY_TITLE.SEND_MULTIMEDIA}'
          when m.type = '${MESSAGE_TYPE.VOICE_RECORD}' then '${HISTORY_TITLE.SEND_MULTIMEDIA}'
        end
       ) as title,
      cr.networkId
      from messages m
      inner join chat_room cr on cr.id = m.chatRoomId
      inner join network n on n.id = cr.networkId
      left join ( select refId, 
                         refTable,
                         max(txStatus) as txStatus,
                         sum( cast(feeAmount as DECIMAL(10,6))) as feeAmount,
                         group_concat(txHash) as transactionHashes
                  from blockchainTx 
                  group by refId, refTable        
                 ) b on b.refId = m.id and b.refTable = '${BLOCKCHAINTX_REFTABLE.MESSAGE}'
      inner join member_in_room mir on mir.chatRoomId = cr.id and mir.userId != ${userId}
      inner join users u on u.id = mir.userId 
      left join user_contact uc on uc.userId = ${userId} and lower(uc.address) = lower(mir.walletAddress)
      where m.id = ${message.id}
      and cr.isGroup = 0`;
    } else {
      return ` select distinct 
      m.walletAddress as fromAddress,
      n.rpcEndpoint,
      n.nativeTokenSymbol as feeSymbol,
      b.feeAmount,
      if(
        m.status = '${MESSAGE_STATUS.HIDDEN}',
        if(
          b.txStatus = '${BLOCKCHAIN_TX_STATUS.VERIFIED}', 
          '${MESSAGE_STATUS.COMPLETED}',
          '${MESSAGE_STATUS.FAILED}'
          ),
        m.status
      ) as status,   
      b.transactionHashes,
      m.createdAt,
      (case when m.type = '${MESSAGE_TYPE.TEXT}' then concat('To ', cr.name)
            when m.type = '${MESSAGE_TYPE.FILE}' then concat('To ', cr.name) 
            when m.type = '${MESSAGE_TYPE.ATTACHMENTS}' then concat('To ', cr.name) 
            when m.type = '${MESSAGE_TYPE.IMAGE}' then concat('To ', cr.name) 
            when m.type = '${MESSAGE_TYPE.VIDEO}' then concat('To ', cr.name) 
            when m.type = '${MESSAGE_TYPE.VOICE_RECORD}' then concat('To ', cr.name) 
            when m.type = '${MESSAGE_TYPE.ROOM_NOTIFICATION}' then
              ( case  when rnt.type = '${QUEUE_JOB.CHAT.ACCEPT_JOIN_GROUP}' then 
                                            ( case  when mems.quantity = 1 then concat('Added ', ifnull(uc.name, u.name), ' to ', cr.name)
                                                    when mems.quantity > 1 then concat('Added ', mems.quantity, ' people to ', cr.name)
                                               end)
                      when rnt.type = '${QUEUE_JOB.CHAT.REMOVE_MEMBERS}' then 
                                            ( case  when mems.quantity = 1 then concat('Remove ', ifnull(uc.name, u.name), ' from ', cr.name)
                                                    when mems.quantity > 1 then concat('Remove ', mems.quantity, ' people from ', cr.name)
                                               end)
                      when rnt.type = '${QUEUE_JOB.CHAT.LEAVE_ROOM}' then concat('Leave ', cr.name)
                      when rnt.type = '${QUEUE_JOB.CHAT.REMOVE_ADMIN}' then concat('Removed admin role from ', ifnull(uc.name, u.name))
                      when rnt.type = '${QUEUE_JOB.CHAT.SET_ADMIN}' then concat('Set admin role to ', ifnull(uc.name, u.name))
                end)
            when m.type = '${MESSAGE_TYPE.ROOM_ACTION}' then
              ( case  when rat.type = '${QUEUE_JOB.CHAT.CREATE_GROUP_CHAT}' then concat('Create group ', cr.name)
                      when rat.type = '${QUEUE_JOB.CHAT.CHANGE_GROUP_NAME}' then concat('Change group name to ', rat.data)
                end)
        end 
       ) as detail,
       (case when m.type = '${MESSAGE_TYPE.TEXT}' then '${HISTORY_TITLE.SEND_MESSAGE}'
          when m.type = '${MESSAGE_TYPE.FILE}' then '${HISTORY_TITLE.SEND_MULTIMEDIA}'
          when m.type = '${MESSAGE_TYPE.ATTACHMENTS}' then '${HISTORY_TITLE.SEND_MULTIMEDIA}'
          when m.type = '${MESSAGE_TYPE.IMAGE}' then '${HISTORY_TITLE.SEND_MULTIMEDIA}'
          when m.type = '${MESSAGE_TYPE.VIDEO}' then '${HISTORY_TITLE.SEND_MULTIMEDIA}'
          when m.type = '${MESSAGE_TYPE.VOICE_RECORD}' then '${HISTORY_TITLE.SEND_MULTIMEDIA}'
          when m.type = '${MESSAGE_TYPE.ROOM_NOTIFICATION}' then 
            ( case  when rnt.type = '${QUEUE_JOB.CHAT.ACCEPT_JOIN_GROUP}' then '${HISTORY_TITLE.ADD_MEMBER}'
                    when rnt.type = '${QUEUE_JOB.CHAT.REMOVE_MEMBERS}' then '${HISTORY_TITLE.REMOVE_MEMBER}'
                    when rnt.type = '${QUEUE_JOB.CHAT.LEAVE_ROOM}' then '${HISTORY_TITLE.LEAVE_GROUP}'
                    when rnt.type = '${QUEUE_JOB.CHAT.REMOVE_ADMIN}' then '${HISTORY_TITLE.REMOVE_ADMIN}'
                    when rnt.type = '${QUEUE_JOB.CHAT.SET_ADMIN}' then '${HISTORY_TITLE.SET_ADMIN}'
              end)
          when m.type = '${MESSAGE_TYPE.ROOM_ACTION}' then 
            ( case  when rat.type = '${QUEUE_JOB.CHAT.CREATE_GROUP_CHAT}' then '${HISTORY_TITLE.CREATE_GROUP_CHAT}'
                    when rat.type = '${QUEUE_JOB.CHAT.CHANGE_GROUP_NAME}' then '${HISTORY_TITLE.CHANGE_GROUP_NAME}'
              end)                                       
        end
       ) as title,
      cr.networkId
      from messages m
      inner join chat_room cr on cr.id = m.chatRoomId
      inner join network n on n.id = cr.networkId
      left join ( select refId, 
                         refTable,
                         max(txStatus) as txStatus, 
                         sum( cast(feeAmount as DECIMAL(10,6))) as feeAmount,
                         group_concat(txHash) as transactionHashes
                  from blockchainTx 
                  group by refId, refTable        
                 ) b on b.refId = m.id and b.refTable = '${BLOCKCHAINTX_REFTABLE.MESSAGE}'
      left outer join room_action_tx rat on rat.messageId = m.id
      left outer join room_notification_tx rnt on rnt.messageId = m.id
      left outer join user_wallet uw on lower(uw.address) = lower(rnt.walletAddress)
      left outer join users u on u.id = uw.userId
      left outer join user_contact uc on uc.userId = ${userId} and lower(uc.address) = lower(rnt.walletAddress)
      left outer join (select count(distinct walletAddress) as quantity, messageId from room_notification_tx group by messageId) mems  on mems.messageId = m.id
      where m.id = ${message.id}
      and cr.isGroup = 1`;
    }
  }

  async getMessageInfoById(messageId: number) {
    const sql = `select m.*, cr.isGroup 
    from messages m
    inner join chat_room cr on cr.id = m.chatRoomId
    where m.id = ${messageId}`;
    // const slaveQueryRunner = getConnection().createQueryRunner(
    //   REPLICATION_MODE.SLAVE,
    // );
    // const messages = await slaveQueryRunner.query(sql);

    const entityManager = getManager();
    const messages = await entityManager.query(sql);

    if (!messages || !messages.length) {
      return;
    } else {
      return messages[0];
    }
  }

  async saveTransaction(transaction: Transaction) {
    const newTransaction = plainToClass(Transaction, transaction);
    return await this.transactionRepository.save(newTransaction);
  }

  async getTransactionById(
    ctx: RequestContext,
    id: number,
  ): Promise<TransactionOutput> {
    this.logger.log(ctx, `${this.constructor.name} was called`);

    const transaction = await this.transactionRepository.findOne(id);

    const [userToken, message] = await Promise.all([
      this.userTokenService.findByTokenAddressAndUserId(
        transaction.tokenAddress,
        transaction.userId,
      ),
      this.messageService.findMessageByTransactionId(transaction.id),
    ]);

    if (transaction.type === TRANSACTION_TYPE.WITHDRAW_RED_PACKET) {
      if (!message) {
        throw new Error("Transaction doesn't belong to any room");
      }
      const roomId = message?.chatRoomId;
      const isCurrentUserJoined =
        await this.memberInRoomService.findJoinedMemberByUserId(
          ctx.user.id,
          roomId,
        );
      if (!isCurrentUserJoined) {
        throw new Error(
          "You're not member of the room this transaction belongs to.",
        );
      }
    }

    return plainToClass(TransactionOutput, {
      ...transaction,
      amount: this.calcAmountOfTransaction(
        transaction.amount,
        userToken.tokenDecimal,
      ),
    });
  }
}
