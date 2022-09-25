import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_token')
export class UserToken {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: number;

  @Index()
  @Column('bigint')
  userId: number;

  @Column('bigint')
  networkId: number;

  @Column()
  tokenName: string;

  @Column()
  tokenSymbol: string;

  @Column()
  tokenAddress: string;

  @Column()
  tokenDecimal: number;

  @Column()
  idEnabled: boolean;

  @Column({
    nullable: true,
  })
  logo: string;

  @Column({
    type: 'longtext',
    nullable: true,
  })
  abi: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
