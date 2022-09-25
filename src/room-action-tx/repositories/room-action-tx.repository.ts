import { EntityRepository, Repository } from 'typeorm';

import { RoomActionTx } from '../entities/room-action-tx.entity';

@EntityRepository(RoomActionTx)
export class RoomActionTxRepository extends Repository<RoomActionTx> {}
