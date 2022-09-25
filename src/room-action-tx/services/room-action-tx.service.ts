import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { MESSAGE_STATUS } from 'src/shared/constants';

import { RoomActionTx } from '../entities/room-action-tx.entity';
import { RoomActionTxRepository } from '../repositories/room-action-tx.repository';

@Injectable()
export class RoomActionTxService {
  constructor(private readonly repository: RoomActionTxRepository) {}

  async createOne(input: {
    chatRoomId: number;
    walletAddress: string;
    type: string;
    data: string;
    messageId: number;
  }): Promise<RoomActionTx> {
    return this.repository.save(
      plainToClass(RoomActionTx, {
        ...input,
        status: MESSAGE_STATUS.IN_PROGRESS,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  }
}
