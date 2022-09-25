import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('network')
export class Network {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: number;

  @Column()
  name: string;

  @Column()
  chainName: string;

  @Column()
  chainId: string;

  @Column()
  rpcEndpoint: string;

  @Column()
  explorerEndpoint: string;

  @Column()
  blockTime: number;

  @Column()
  nativeTokenSymbol: string;

  @Column()
  blockConfirmation: number;

  @Column()
  idEnabled: boolean;

  @Column({
    nullable: true,
  })
  logo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
