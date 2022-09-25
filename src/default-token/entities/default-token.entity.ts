import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('default_token')
export class DefaultToken {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: number;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
