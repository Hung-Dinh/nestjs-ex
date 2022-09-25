import { EntityRepository, Repository } from 'typeorm';

import { RoomNotificationTx } from '../entities/room-notification-tx.entity';

@EntityRepository(RoomNotificationTx)
export class RoomNotificationTxRepository extends Repository<RoomNotificationTx> {}
