import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('messages')
@Index(['chatRoomId', 'userId'])
export class Message {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: number;

  @Column('bigint')
  chatRoomId: number;

  @Column('bigint')
  userId: number;

  @Column()
  walletAddress: string;

  @Column({
    nullable: true,
    type: 'bigint',
  })
  replyTo: number;

  @Column()
  type: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  content: string;

  @Column({
    nullable: true,
  })
  file: string;

  @Column({
    nullable: true,
  })
  downloadUrl: string;

  @Column({
    default: false,
  })
  isPinned: boolean;

  @Column()
  status: string;

  @Column({
    default: 1,
    nullable: true,
  })
  numberOfTxs: number;

  @Column({
    default: 0,
    nullable: true,
  })
  retryCount: number;

  @Column({
    nullable: true,
    type: 'bigint',
  })
  transactionId: number;

  @Column({
    nullable: true,
    type: `text`
  })
  fileInfo: string;

  @Column({
    nullable: true,
    type: 'datetime',
  })
  retryAt: Date;

  @CreateDateColumn({ name: 'createdAt', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', nullable: true })
  updatedAt: Date;
}
