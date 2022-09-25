import { EntityRepository, Repository } from 'typeorm';

import { RoomKey } from '../entities/room-key.entity';

@EntityRepository(RoomKey)
export class RoomKeyRepository extends Repository<RoomKey> {}
