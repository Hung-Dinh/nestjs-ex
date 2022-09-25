import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_hdwallet')
@Index(['userId', 'kmsDataKeyId', 'networkId'])
export class UserHdWallet {
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

  @Column({
    nullable: true,
    unique: true,
  })
  seedPhrase: string;

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

  @Column('bigint')
  networkId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
