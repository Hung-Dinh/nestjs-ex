import BigNumber from 'bignumber.js';

export class BigNumberTool {
  static toBigNumber(value: string | number): BigNumber {
    return new BigNumber(value);
  }

  static toPower(value: string | number, power: number): BigNumber {
    return new BigNumber(value).pow(power);
  }

  static toMultiply(value: string | number, multiply: number): BigNumber {
    return new BigNumber(value).multipliedBy(multiply);
  }

  static toMultiplyBigNumber(
    value: string | number,
    multiply: BigNumber,
  ): BigNumber {
    return new BigNumber(value).multipliedBy(new BigNumber(multiply));
  }

  static toDevideBigNumber(
    value: string | number,
    devide: BigNumber,
  ): BigNumber {
    return new BigNumber(value).dividedBy(new BigNumber(devide));
  }

  static toString(value: BigNumber): string {
    return value.toString();
  }

  static formatNumber = (
    amount: number,
    numberOfDecimalDigits = 2,
    zeroValue = '0',
  ): string => {
    if (!amount || isNaN(amount)) {
      return zeroValue;
    }

    const balanceFormated = new BigNumber(amount.toString());
    const a = balanceFormated
      .toFormat(numberOfDecimalDigits, BigNumber.ROUND_HALF_UP)
      .replace(/,/g, '');
    const b = balanceFormated.toFormat().replace(/,/g, '');
    if (a.length > b.length) {
      return b;
    }
    if (Number(a) === 0) {
      return zeroValue;
    }
    return a;
  };
}
