import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Index(['userId'])
@Entity({
  name: 'user_block',
})
export class UserBlock {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: number;

  @Column({
    type: 'bigint',
  })
  userId: number;

  @Column({
    type: 'bigint',
  })
  blockedUserId: number;

  @Column()
  blockedWalletAddress: string;

  @Column({
    type: 'boolean',
  })
  status: boolean;

  @Column({
    type: 'text',
  })
  reportContent: string;

  @Column({
    default: 'spam',
  })
  type: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
