import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('room_notification_tx')
export class RoomNotificationTx {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: number;

  @Column('bigint')
  chatRoomId: number;

  @Column('bigint')
  messageId: number;

  @Column()
  walletAddress: string;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  blockchainTxId: number;

  @Column()
  status: string;

  @Column()
  type: string;

  @CreateDateColumn({ name: 'createdAt', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', nullable: true })
  updatedAt: Date;
}
