import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { DefaultTokenOutput } from '../dtos/default-token-output.dto';
import { DefaultTokenRepository } from '../repositories/default-token.repository';

@Injectable()
export class DefaultTokenService {
  constructor(
    private logger: AppLogger,
    private readonly defaultTokenRepository: DefaultTokenRepository,
  ) {
    this.logger.setContext(DefaultTokenService.name);
  }

  async getDefaultTokenList(
    ctx: RequestContext,
    limit: number,
    offset: number,
  ): Promise<{
    tokens: DefaultTokenOutput[];
    count: number;
  }> {
    this.logger.log(ctx, `${this.getDefaultTokenList.name} was called`);

    this.logger.log(ctx, `calling ${DefaultTokenRepository.name}.findAndCount`);
    const [defaultTokens, count] =
      await this.defaultTokenRepository.findAndCount({
        where: {},
        take: limit,
        skip: offset,
      });

    const defaultTokensOutput = plainToClass(
      DefaultTokenOutput,
      defaultTokens,
      {
        excludeExtraneousValues: true,
      },
    );
    return { tokens: defaultTokensOutput, count };
  }

  async getdefaultTokenList(): Promise<DefaultTokenOutput[]> {
    const defaultTokenList = await this.defaultTokenRepository.find();
    return plainToClass(DefaultTokenOutput, defaultTokenList, {
      excludeExtraneousValues: true,
    });
  }
}
