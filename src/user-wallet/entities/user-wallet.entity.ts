import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_wallet')
@Index(['userId', 'kmsDataKeyId', 'networkId', 'userHDWalletId'])
export class UserWallet {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: number;

  @Column('bigint')
  userId: number;

  @Column({
    nullable: true,
  })
  walletName: string;

  @Column()
  address: string;

  @Column({
    nullable: true,
  })
  privateKey: string;

  @Column()
  isHD: boolean;

  @Column({
    nullable: true,
  })
  hdPath: string;

  @Column({
    nullable: true,
    type: 'bigint',
  })
  kmsDataKeyId: number;

  @Column()
  isExternal: boolean;

  @Column({
    nullable: true,
  })
  currentBlockNumber: number;

  @Column('bigint')
  userHDWalletId: number;

  @Column('bigint')
  networkId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
