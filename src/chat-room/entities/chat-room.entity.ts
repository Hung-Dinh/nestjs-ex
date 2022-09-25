import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('chat_room')
export class ChatRoom {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: number;

  @Index()
  @Column('bigint')
  ownerId: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  contractAddress: string;

  @Column()
  isGroup: boolean;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  channelId: string;

  @Column()
  status: string;

  @Column()
  networkId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
