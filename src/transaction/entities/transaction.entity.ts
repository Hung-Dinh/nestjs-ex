import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('transaction')
@Index(['userId', 'userWalletId', 'networkId'])
export class Transaction {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: number;

  @Column()
  type: string;

  @Column('bigint')
  userId: number;

  @Column('bigint')
  userWalletId: number;

  @Column('bigint')
  networkId: number;

  @Index({ unique: true })
  @Column({
    nullable: true,
  })
  txHash: string;

  @Column('bigint', {
    nullable: true,
  })
  blockchainTxId: number;

  @Column()
  fromAddress: string;

  @Column()
  toAddress: string;

  @Column({
    nullable: true,
  })
  tokenSymbol: string;

  @Column({
    nullable: true,
  })
  tokenAddress: string;

  @Column({
    nullable: true,
  })
  feeLevel: string;
  
  @Column()
  amount: string;

  @Column({
    nullable: true,
  })
  memoCode: string;

  @Column()
  transactionStatus: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
