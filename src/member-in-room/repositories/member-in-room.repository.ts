import { EntityRepository, Repository } from 'typeorm';

import { MemberInRoom } from '../entities/member-in-room.entity';

@EntityRepository(MemberInRoom)
export class MemberInRoomRepository extends Repository<MemberInRoom> {}
