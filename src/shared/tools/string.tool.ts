import * as faker from 'faker';

export class StringTool {
  static generateWords(count: number): string {
    // generate count random words using faker
    const words = [];
    for (let i = 0; i < count; i++) {
      words.push(faker.random.word());
    }
    return words.join(',');
  }

  static generateRandomWord(): string {
    const length = Math.floor(Math.random() * 10) + 10;
    const baseString = '0123456789abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = length; i > 0; --i)
      result += baseString[Math.floor(Math.random() * baseString.length)];
    return result;
  }

  static removeAccents(str: string): string {
    if (!str) {
      return '';
    }
    return str
      .toString()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/đ/g, 'd')
      .replace(/\s/g, '');
  }

  static normalizeFileName(filename: string): string {
    return this.removeAccents(filename).replace(
      /!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g,
      '',
    );
  }
}
