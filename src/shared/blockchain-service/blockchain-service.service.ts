import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { CheckSufficientFundOutput } from 'src/user-wallet/dtos/check-sufficient-funds-output.dto';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

import {
  BALANCE_DECIMAL_PLACES,
  CHAT_TRANSACTION_METHODS,
  CHECK_SUFFICIENT_FUND_MSG,
  MIN_REMAINING_TOKEN_AMOUNT,
  TRANSACTION_TYPES,
} from '../constants';
import { ERC_20_ABI } from '../constants/ERC-20-abi';
import {
  PANCAKE_SWAP_ABI,
  PANCAKE_SWAP_CONTRACT,
} from '../constants/pancakeSwapAbi';
import AbiGroupChat from './constants/group-chat.json';
import AbiP2P from './constants/p2p-chat.json';
import { POLYGON } from './constants/smart-contract.constant';

@Injectable()
export class BlockchainService {
  web3Provider(providerUrl: string) {
    const web3 = new Web3();
    const provider = providerUrl?.startsWith('ws')
      ? new Web3.providers.WebsocketProvider(providerUrl)
      : new Web3.providers.HttpProvider(providerUrl);

    web3.setProvider(provider);
    return web3;
  }

  getTokenInfomation = async (providerUrl: string, tokenAddress: string) => {
    const web3 = this.web3Provider(providerUrl);
    const tokenInst = new web3.eth.Contract(
      ERC_20_ABI as AbiItem[],
      tokenAddress,
    );
    const tokenDecimal = await tokenInst?.methods.decimals().call();
    const tokenName = await tokenInst.methods.name().call();
    const tokenSymbol = await tokenInst.methods.symbol().call();
    return { tokenDecimal, tokenName, tokenSymbol };
  };

  compareAddress(address1, address2) {
    return address1.toLowerCase() === address2.toLowerCase();
  }

  formatPoint(point, decimal) {
    const numberPoint = parseFloat(point);
    return this.roundNum(numberPoint / Math.pow(10, decimal), 6);
  }

  // yêu cầu lấy balance không làm tròn số cuối
  roundNum(num, length) {
    const number =
      Math.floor(num * Math.pow(10, length)) / Math.pow(10, length);
    return number;
  }

  getFixed(number: string, decimals = 6): string {
    const parts = number.split('.');
    if (parts.length === 1) return parts[0];

    if (parts[1].length < decimals) {
      return `${parts[0]}.${parts[1]}`;
    }

    return `${parts[0]}.${parts[1].substring(0, decimals)}`;
  }

  toFixed(x) {
    if (Math.abs(x) < 1.0) {
      const e = parseInt(x.toString().split('e-')[1]);
      if (e) {
          x *= Math.pow(10,e-1);
          x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
      }
    } else {
      let e = parseInt(x.toString().split('+')[1]);
      if (e > 20) {
          e -= 20;
          x /= Math.pow(10,e);
          x += (new Array(e+1)).join('0');
      }
    }
    return x;
  }

  async getBalanceToken(
    walletAddress: string,
    tokenAddress: string,
    tokenDecimal: number,
    providerUrl: string,
  ): Promise<{
    tokenBalance: string;
    tokenAddress: string;
  }> {
    const web3 = this.web3Provider(providerUrl);
    if (this.compareAddress(tokenAddress, process.env.DEFAULT_ADRESS)) {
      const networkBalance = await web3.eth.getBalance(walletAddress);
      const networkBalanceBN = new BigNumber(
        web3.utils.fromWei(networkBalance),
      );

      console.debug('networkBalanceBN', networkBalanceBN.toString());
      return {
        tokenBalance: this.getFixed(
          this.toFixed(networkBalanceBN.toString()), 
          BALANCE_DECIMAL_PLACES,
        ),
        tokenAddress,
      };
    }
    const tokenInst = new web3.eth.Contract(
      ERC_20_ABI as AbiItem[],
      tokenAddress,
    );
    const balance = await tokenInst.methods.balanceOf(walletAddress).call();
    const balanceBN = new BigNumber(balance).multipliedBy(
      new BigNumber(10).pow(-tokenDecimal),
    );
    console.log('balance', balance);
    console.log('tokenDecimal', tokenDecimal);
    console.debug('balanceBN', balanceBN.toString());

    return {
      tokenBalance: this.getFixed(
        this.toFixed(balanceBN.toString()), 
        BALANCE_DECIMAL_PLACES
      ),
      tokenAddress,
    };
  }

  async calcBNBPrice() {
    const web3 = this.web3Provider(process.env.BSC_PROVIDER_URL);
    const WBNBTokenAddress = process.env.BSC_WBNB_TOKEN_ADDRESS;
    const USDTokenAddress = process.env.BSC_USDT_TOKEN_ADDRESS;
    const bnbToSell = web3.utils.toWei('1', 'ether');
    let amountOut;
    try {
      const router = await new web3.eth.Contract(
        PANCAKE_SWAP_ABI as AbiItem[],
        PANCAKE_SWAP_CONTRACT,
      );
      amountOut = await router.methods
        .getAmountsOut(bnbToSell, [WBNBTokenAddress, USDTokenAddress])
        .call();
      amountOut = web3.utils.fromWei(amountOut[1]);
    } catch (error) {}

    if (!amountOut) return 0;
    return amountOut;
  }

  setDecimals(number, decimals) {
    number = number.toString();
    const numberAbs = number.split('.')[0];
    let numberDecimals = number.split('.')[1] ? number.split('.')[1] : '';
    while (numberDecimals.length < decimals) {
      numberDecimals += '0';
    }
    return numberAbs + numberDecimals;
  }

  async calcTokenPrice(
    tokenQuantity: number,
    tokenAddres: string,
    tokenDecimal: number,
    BNBprice: number,
  ) {
    const web3 = this.web3Provider(process.env.BSC_PROVIDER_URL);
    const WBNBTokenAddress = process.env.BSC_WBNB_TOKEN_ADDRESS;
    const tokensToSell = this.setDecimals(tokenQuantity, tokenDecimal);
    let amountOut;
    try {
      const router = await new web3.eth.Contract(
        PANCAKE_SWAP_ABI as AbiItem[],
        PANCAKE_SWAP_CONTRACT,
      );
      amountOut = await router.methods
        .getAmountsOut(tokensToSell, [tokenAddres, WBNBTokenAddress])
        .call();
      amountOut = web3.utils.fromWei(amountOut[1]);
    } catch (error) {
      console.log('error: ', error);
    }

    if (!amountOut) return '0';
    return this.roundNum(amountOut * BNBprice, 6).toString();
  }

  async isValidAddress(address: string) {
    const web3 = new Web3();
    const result = web3.utils.isAddress(address.toLowerCase());
    return result;
  }

  getAbi(tokenSymbol: string): AbiItem[] {
    // TODO: get abi from polygon
    return ERC_20_ABI as AbiItem[];
  }

  async getTransactionFee({
    fromAddress,
    providerUrl,
    toAddress,
    data,
    feeAmount,
  }: {
    providerUrl: string;
    fromAddress: string;
    toAddress?: string;
    data: any;
    feeAmount: number;
  }): Promise<number> {
    const web3 = this.web3Provider(providerUrl);

    console.debug('getTransactionFee', fromAddress, toAddress, data, feeAmount);

    const estimatedGas = await web3.eth.estimateGas({
      from: fromAddress,
      data,
      ...((toAddress && { to: toAddress }) || {}),
    });
    const gasLimit = Math.ceil(estimatedGas * 1.5);
    return (gasLimit * (feeAmount || 0)) / 1e9;
  }

  async deployNewGroupChat(
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    contractProvider: any,
    systemAddress: string,
    name: string,
    bytecode: string,
  ): Promise<any> {
    return contractProvider
      .deploy({
        data: bytecode,
        arguments: [systemAddress, name],
      })
      .encodeABI();
  }

  async buildAbi({
    type,
    input,
    toAddresses,
    providerUrl,
    contractAddress,
  }: {
    input: any;
    type: string;
    providerUrl: string;

    toAddresses?: string[];
    contractAddress?: string;
  }): Promise<any> {
    const web3 = this.web3Provider(providerUrl);

    let outputAbi = null;
    switch (type) {
      case TRANSACTION_TYPES.CREATE_GROUP_CHAT:
        {
          const contract = new web3.eth.Contract(AbiGroupChat.abi as AbiItem[]);
          const bytecode = AbiGroupChat.bytecode;
          const systemAdminAddress = POLYGON.systemAdminAddress;

          outputAbi = await this.deployNewGroupChat(
            contract,
            systemAdminAddress,
            input.groupName,
            bytecode,
          );
        }
        break;
      case TRANSACTION_TYPES.ACCEPT_JOIN_GROUP:
      case TRANSACTION_TYPES.ADD_MEMBERS:
      case TRANSACTION_TYPES.REMOVE_MEMBERS:
        {
          const contract = new web3.eth.Contract(
            AbiGroupChat.abi as AbiItem[],
            contractAddress,
          );
          outputAbi =
            contract.methods[CHAT_TRANSACTION_METHODS[type]](
              toAddresses,
            ).encodeABI();
        }
        break;
      case TRANSACTION_TYPES.CHANGE_GROUP_NAME:
        {
          const contract = new web3.eth.Contract(
            AbiGroupChat.abi as AbiItem[],
            contractAddress,
          );
          outputAbi = contract.methods[CHAT_TRANSACTION_METHODS[type]](
            input.newGroupName,
          ).encodeABI();
        }
        break;
      case TRANSACTION_TYPES.LEAVE_ROOM:
        {
          const contract = new web3.eth.Contract(
            AbiGroupChat.abi as AbiItem[],
            contractAddress,
          );
          outputAbi =
            contract.methods[CHAT_TRANSACTION_METHODS[type]]().encodeABI();
        }
        break;
      case TRANSACTION_TYPES.SEND_MESSAGE_TO_GROUP:
        {
          const contract = new web3.eth.Contract(
            AbiGroupChat.abi as AbiItem[],
            contractAddress,
          );
          outputAbi = contract.methods
            .SendText(input.messageId, input.messageContent)
            .encodeABI();
        }
        break;
      case TRANSACTION_TYPES.SEND_MESSSAGE_TO_PEER:
        {
          console.log('POLYGON.p2pContractAddress', POLYGON.p2pContractAddress);
          console.log('toAddresses', toAddresses);
          const contract = new web3.eth.Contract(
            AbiP2P.abi as AbiItem[],
            POLYGON.p2pContractAddress,
          );
          outputAbi = contract.methods
            .SendText(input.messageId, toAddresses[0], input.messageContent)
            .encodeABI();
        }
        break;
      case TRANSACTION_TYPES.SEND_TOKEN:
        {
          const contract = new web3.eth.Contract(
            this.getAbi(input.tokenSymbol),
            contractAddress,
          );
          outputAbi = contract.methods
            .transfer(
              toAddresses[0],
              new BigNumber(input.amount).multipliedBy(
                new BigNumber(10).pow(input?.tokenDecimal || 18),
              ),
            )
            .encodeABI();
        }
        break;
      default:
        console.debug('Transaction type not found');
    }

    return outputAbi;
  }

  async isEnoughBalance({
    type,
    data,
    feeAmount,
    toAddresses,
    providerUrl,
    walletAddress,
    contractAddress,
    networkDefaultToken,
  }: {
    type: any;
    data: any;
    feeAmount: number;
    providerUrl: string;
    walletAddress: string;
    toAddresses?: string[];
    contractAddress?: string;
    networkDefaultToken: string;
  }): Promise<CheckSufficientFundOutput> {
    const web3 = this.web3Provider(providerUrl);
    const networkTokenBalance = new BigNumber(
      web3.utils.fromWei(await web3.eth.getBalance(walletAddress)),
    );
    let tokenBalance = networkTokenBalance;

    if (data?.tokenSymbol) {
      tokenBalance = new BigNumber(
        (
          await this.getBalanceToken(
            walletAddress,
            contractAddress,
            data.tokenDecimal,
            providerUrl,
          )
        )?.tokenBalance || 0,
      );
    }

    try {
      const txAbi = await this.buildAbi({
        input: data,
        providerUrl,
        type,
        contractAddress,
        toAddresses,
      });

      if (!txAbi) {
        throw new Error('Failed to build abi for transaction');
      }

      const transactionFee = await this.getTransactionFee({
        providerUrl,
        fromAddress: walletAddress,
        toAddress: contractAddress,
        data: txAbi,
        feeAmount,
      });

      /**
       * multiply is used for message which is devided into multi parts
       * Currently we removed it
       */
      const totalTransactionFee = transactionFee * (data?.multiply || 1);
      let isSufficient =
        networkTokenBalance.comparedTo(new BigNumber(totalTransactionFee)) >= 0;
      let msg =
        (!isSufficient && CHECK_SUFFICIENT_FUND_MSG.INSUFFICIENT_BALANCE) || '';

      if (data?.tokenSymbol) {
        if (
          data.tokenSymbol.toLowerCase() === networkDefaultToken.toLowerCase()
        ) {
          const maxSendTokenAmount = networkTokenBalance.minus(
            new BigNumber(
              Math.max(MIN_REMAINING_TOKEN_AMOUNT, totalTransactionFee),
            ),
          );
          isSufficient =
            new BigNumber(data.amount).comparedTo(maxSendTokenAmount) <= 0;
        } else {
          isSufficient =
            tokenBalance.comparedTo(new BigNumber(data.amount)) >= 0 &&
            networkTokenBalance.comparedTo(
              new BigNumber(totalTransactionFee),
            ) >= 0;
        }

        if (!isSufficient) {
          msg = CHECK_SUFFICIENT_FUND_MSG.INSUFFICIENT_BALANCE;
        }
      }

      return {
        isSufficient,
        transactionFee: totalTransactionFee,
        tokenBalance: tokenBalance.toString(),
        networkTokenBalance: networkTokenBalance.toString(),
        amount: data?.amount || 0,
        hasError: false,
        msg,
        networkDefaultToken,
      };
    } catch (error) {
      console.error(
        `${this.isEnoughBalance.name} error: ${error?.message || ''}`,
      );

      return {
        isSufficient: false,
        networkTokenBalance: networkTokenBalance.toString(),
        tokenBalance: tokenBalance.toString(),
        amount: data?.amount || 0,
        transactionFee: 0,
        hasError: true,
        msg: error?.message || '',
        networkDefaultToken,
      };
    }
  }
}
