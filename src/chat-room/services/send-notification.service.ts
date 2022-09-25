import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { JOB_OPTIONS } from 'src/shared/constants';
import { QUEUE_JOB, QUEUE_NAME } from 'src/shared/constants/queue.constant';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { NoticationDTO } from '../dtos/send-notification.dto';

@Injectable()
export class SendNotificationService {
  constructor(
    private logger: AppLogger,
    @InjectQueue(QUEUE_NAME.SOCKET)
    private readonly socketQueue: Queue,
  ) {
    this.logger.setContext(SendNotificationService.name);
  }

  async addNotificationToQueue(
    ctx: RequestContext,
    data: NoticationDTO,
  ): Promise<void> {
    try {
      await this.socketQueue.add(QUEUE_JOB.SOCKET.SOCKET, data, JOB_OPTIONS);
      console.log('data socket_________________________________', data);
    } catch (error) {
      this.logger.error(ctx, `${SendNotificationService.name} error:`, error);
    }
  }
}
