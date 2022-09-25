import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { MemberInRoomService } from 'src/member-in-room/services/member-in-room.service';
import { MEMBER_IN_ROOM_ROLE } from 'src/shared/constants';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { DiffeHellmanTool } from 'src/shared/tools/diffe-hellman.tool';

import { RoomKeyOutput } from '../dtos/room-key-output.dto';
import { RoomKey } from '../entities/room-key.entity';
import { RoomKeyRepository } from '../repositories/room-key.repository';

@Injectable()
export class RoomKeyService {
  constructor(
    private readonly logger: AppLogger,
    private readonly roomKeyRepository: RoomKeyRepository,
    @Inject(forwardRef(() => MemberInRoomService))
    private readonly memberInRoomService: MemberInRoomService,
  ) {
    this.logger.setContext(RoomKeyService.name);
  }

  async findRoomKeyByRoomIdAndSide(
    roomId: number,
    side: string,
  ): Promise<RoomKey> {
    return await this.roomKeyRepository.findOne({
      where: {
        roomId,
        side,
      },
    });
  }

  async findRoomKeyByUserIdAndRoomId(
    userId: number,
    roomId: number,
  ): Promise<RoomKey> {
    const memberInRoom =
      await this.memberInRoomService.findJoinedMemberByUserId(userId, roomId);

    if (!memberInRoom) {
      throw new Error('User is not joined in room');
    }
    const memberRole = memberInRoom.role;

    return this.findRoomKeyByRoomIdAndSide(
      roomId,
      memberRole === MEMBER_IN_ROOM_ROLE.OWNER ? 'originator' : 'participant',
    );
  }

  async createRoomKeys(roomId: number): Promise<RoomKey[]> {
    const originatorKeyPair = DiffeHellmanTool.createKeyPair();
    const participantKeyPair = DiffeHellmanTool.createKeyPair();

    const sharedKey = DiffeHellmanTool.createSharedKey(
      originatorKeyPair.publicKey,
      participantKeyPair.privateKey,
    );
    const iv = DiffeHellmanTool.generateInitializationVector();

    const originatorRoomKey = plainToClass(RoomKey, {
      roomId,
      sharedKey,
      publicKey: originatorKeyPair.publicKey,
      privateKey: originatorKeyPair.privateKey,
      iv,
      side: 'originator',
    });

    const participantRoomKey = plainToClass(RoomKey, {
      roomId,
      sharedKey,
      publicKey: participantKeyPair.publicKey,
      privateKey: participantKeyPair.privateKey,
      side: 'participant',
      iv,
    });

    return await this.roomKeyRepository.save([
      originatorRoomKey,
      participantRoomKey,
    ]);
  }

  async getRoomKey(
    ctx: RequestContext,
    roomId: number,
  ): Promise<RoomKeyOutput> {
    this.logger.log(ctx, `${this.getRoomKey.name} was called`);
    const userId = ctx?.user?.id;
    console.log('ctx', ctx);
    console.log('userId', userId);
    const roomKey = await this.findRoomKeyByUserIdAndRoomId(userId, roomId);
    return plainToClass(RoomKeyOutput, roomKey, {
      excludeExtraneousValues: true,
    });
  }
}
