import { Expose, Type } from 'class-transformer';

export interface NetworksFeesOutput {
  network: string;
  data: NetworkFeesOutput;
}

export class NetworkFeesOutput {
  @Expose()
  @Type(() => Number)
  fast: number;

  @Expose()
  @Type(() => Number)
  medium: number;

  @Expose()
  @Type(() => Number)
  slow: number;
}
