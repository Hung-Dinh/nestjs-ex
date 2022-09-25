import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { MESSAGE_STATUS } from 'src/shared/constants';

import { RoomNotificationTx } from '../entities/room-notification-tx.entity';
import { RoomNotificationTxRepository } from '../repositories/room-notification-tx.repository';

@Injectable()
export class RoomNotificationTxService {
  constructor(private readonly repository: RoomNotificationTxRepository) {}

  async checkProcessingOneAddress(
    chatRoomId: number,
    walletAddress: string,
  ): Promise<any> {
    const listRoomNoti = await this.repository.find({
      where: {
        chatRoomId: chatRoomId,
        walletAddress: walletAddress,
      },
    });

    if (!listRoomNoti || !listRoomNoti.length) {
      return false;
    } else {
      const ten_min_before_timestamp = new Date().getTime() - 1000 * 60 * 10;
      const processRoomNoti = listRoomNoti.find(
        (x) =>
          new Date(x.createdAt).getTime() > ten_min_before_timestamp &&
          x.status != MESSAGE_STATUS.COMPLETED &&
          x.status != MESSAGE_STATUS.FAILED,
      );
      return processRoomNoti ? true : false;
    }
  }

  async checkProcessingAddresses(
    chatRoomId: number,
    walletAddresses: string[],
  ): Promise<any> {
    const dataPromise = [];
    walletAddresses.forEach((walletAddress) => {
      dataPromise.push(
        this.checkProcessingOneAddress(chatRoomId, walletAddress),
      );
    });
    const listProcessingRoomNoti = await Promise.all(dataPromise);
    if (
      listProcessingRoomNoti &&
      listProcessingRoomNoti.find((x) => x === true)
    ) {
      return true;
    } else {
      return false;
    }
  }

  async createOne(input: {
    chatRoomId: number;
    walletAddress: string;
    type: string;
    messageId: number;
  }): Promise<RoomNotificationTx> {
    return this.repository.save(
      plainToClass(RoomNotificationTx, {
        ...input,
        status: MESSAGE_STATUS.IN_PROGRESS,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  }
}
