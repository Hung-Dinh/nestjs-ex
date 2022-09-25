import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('message_tx')
export class MessageTx {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: number;

  @Index()
  @Column('bigint')
  messageId: number;

  @Column()
  status: string;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  blockchainTxId: number;

  @Column({
    default: 1,
    nullable: true,
  })
  messagePartId: number;

  @CreateDateColumn({ name: 'createdAt', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', nullable: true })
  updatedAt: Date;
}
