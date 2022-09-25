import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { MemberInRoomService } from 'src/member-in-room/services/member-in-room.service';
import { MessageService } from 'src/message/services/message.service';
import { MESSAGE_TYPE, SPAM_REPORT_STATUS, SPAM_REPORT_TYPE } from 'src/shared/constants';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { getConnection, getManager } from 'typeorm';

import { AddSpamReportInput } from '../dtos/add-spam-report--input.dto';
import { SpamReportOutput } from '../dtos/spam-report-output.dto';
import { SpamReport } from '../entities/spam-report.entity';
import { SpamReportRepository } from '../repositories/spam-report.repository';

@Injectable()
export class SpamReportService {
  constructor(
    private readonly logger: AppLogger,
    private readonly repository: SpamReportRepository,
    private readonly messageService: MessageService,
    private readonly memberInRoomService: MemberInRoomService,
  ) {
    this.logger.setContext(SpamReportService.name);
  }

  async findById(id: number): Promise<SpamReport> {
    return this.repository.getById(id);
  }

  async findOneByUserIdAndmessageId(userId: number, messageId: number): Promise<SpamReport> {
    return this.repository.findOne({
      where: {
        userId,
        messageId
      },
    });
  }

  async addSpamReport(
    ctx: RequestContext,
    userId: number,
    newSpamReport: AddSpamReportInput,
  ): Promise<SpamReportOutput> {
    this.logger.log(ctx, `${this.addSpamReport.name} was called`);

    const message = await this.messageService.findMessageById(
      newSpamReport.messageId,
    );
    if (!message) {
      throw new Error('Reported message not found!');
    }

    if (message.type == MESSAGE_TYPE.SYSTEM 
        || message.type == MESSAGE_TYPE.ROOM_ACTION
        || message.type == MESSAGE_TYPE.ROOM_NOTIFICATION  
    ) {
      throw new Error('You could not report this message!');
    }

    if (message.userId == userId) {
      throw new Error('You could not report your message!');
    }

    const member = await this.memberInRoomService.findJoinedMemberByUserId(
      userId,
      message.chatRoomId,
    );

    if (!member) {
      throw new Error('User not in this chat room !');
    }

    const existSpamReport = await this.findOneByUserIdAndmessageId(userId, newSpamReport.messageId);
    if (existSpamReport) {
      throw new Error('This message has been reported!');
    }
    
    const spamReport = plainToClass(SpamReport, {
      ...newSpamReport,
      userId: userId,
      type: SPAM_REPORT_TYPE.SPAM,
      status: SPAM_REPORT_STATUS.CREATED
    });
    this.logger.log(
      ctx,
      `calling ${SpamReportRepository.name}.save spamReport`,
    );
    await this.repository.save(spamReport);
    return plainToClass(SpamReportOutput, spamReport, {
      excludeExtraneousValues: true,
    });
     
    
  }

  
  
}
