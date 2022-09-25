import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('blockchainTx')
export class BlockchainTx {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: number;

  @Column()
  fromAddress: string;

  @Column()
  toAddress: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  msgValue: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  msgData: string;

  @Column({
    nullable: true,
  })
  memoCode: string;

  @Column()
  tokenSymbol: string;

  @Column()
  tokenAddress: string;

  @Index()
  @Column('bigint')
  networkId: number;

  @Column({
    nullable: true,
  })
  blockNumber: number;

  @Column({
    nullable: true,
  })
  blockHash: string;

  @Column({
    nullable: true,
  })
  blockTimestamp: string;

  @Column({
    nullable: true,
  })
  feeAmount: string;

  @Column({
    nullable: true,
  })
  feeSymbol: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  unsignedRaw: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  signedRaw: string;

  @Index({ unique: true })
  @Column({
    nullable: true,
  })
  txHash: string;

  @Column()
  txStatus: string;

  @Column()
  retryCount: number;

  @Column()
  refTable: string;

  @Column()
  refId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
