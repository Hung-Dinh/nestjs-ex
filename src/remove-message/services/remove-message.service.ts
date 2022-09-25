import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { MemberInRoomService } from 'src/member-in-room/services/member-in-room.service';
import { MessageService } from 'src/message/services/message.service';
import { MESSAGE_TYPE } from 'src/shared/constants';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { AddRemoveMessageInput } from '../dtos/add-remove-message-input.dto';
import { RemoveMessageOutput } from '../dtos/remove-message-output.dto';
import { RemoveMessage } from '../entities/remove-message.entity';
import { RemoveMessageRepository } from '../repositories/remove-message.repository';

@Injectable()
export class RemoveMessageService {
  constructor(
    private readonly logger: AppLogger,
    private readonly repository: RemoveMessageRepository,
    private readonly messageService: MessageService,
    private readonly memberInRoomService: MemberInRoomService,
  ) {
    this.logger.setContext(RemoveMessageService.name);
  }

  async findById(id: number): Promise<RemoveMessage> {
    return this.repository.getById(id);
  }

  async findOneByUserIdAndmessageId(
    userId: number,
    messageId: number,
  ): Promise<RemoveMessage> {
    return this.repository.findOne({
      where: {
        userId,
        messageId,
      },
    });
  }

  async addRemoveMessage(
    ctx: RequestContext,
    userId: number,
    newRemoveMessage: AddRemoveMessageInput,
  ): Promise<RemoveMessageOutput> {
    this.logger.log(ctx, `${this.addRemoveMessage.name} was called`);

    const message = await this.messageService.findMessageById(
      newRemoveMessage.messageId,
    );
    if (!message) {
      throw new Error('Remove message not found!');
    }

    if (
      message.type == MESSAGE_TYPE.SYSTEM ||
      message.type == MESSAGE_TYPE.ROOM_ACTION ||
      message.type == MESSAGE_TYPE.ROOM_NOTIFICATION
    ) {
      throw new Error('You could not remove this message!');
    }

    const member = await this.memberInRoomService.findJoinedMemberByUserId(
      userId,
      message.chatRoomId,
    );

    if (!member) {
      throw new Error('User not in this chat room !');
    }

    const existRemoveMessage = await this.findOneByUserIdAndmessageId(
      userId,
      newRemoveMessage.messageId,
    );
    if (existRemoveMessage) {
      throw new Error('This message has been removed!');
    }

    const removeMessage = plainToClass(RemoveMessage, {
      ...newRemoveMessage,
      userId: userId,
    });
    this.logger.log(
      ctx,
      `calling ${RemoveMessageRepository.name}.save removeMessage`,
    );
    await this.repository.save(removeMessage);
    return plainToClass(RemoveMessageOutput, removeMessage, {
      excludeExtraneousValues: true,
    });
  }
}
