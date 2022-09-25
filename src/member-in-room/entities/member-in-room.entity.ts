import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('member_in_room')
@Index(['chatRoomId', 'userId'])
export class MemberInRoom {
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

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  nickname: string;

  @Column()
  role: string;

  @Column()
  status: string;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  addedByUserId: number;

  @Column({
    default: false,
  })
  isChatArchived: boolean;

  @Column({
    default: false,
  })
  isPinned: boolean;

  @Column({ nullable: true })
  muteDuration: Date;

  @Column()
  lastViewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
