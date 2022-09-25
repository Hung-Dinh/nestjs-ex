import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_setting')
export class UserSetting {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: number;

  @Index({ unique: true })
  @Column('bigint')
  userId: number;

  @Column()
  language: string;

  @Column()
  displayCurrency: string;

  @Column()
  biometrics: boolean;

  @Column('bigint')
  useUserWalletId: number;

  @Column('bigint')
  useNetworkId: number;

  @Column()
  gasFeeLevel: string;

  @Column()
  isEnableAutosignMessage: boolean;

  @CreateDateColumn({ name: 'createdAt', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', nullable: true })
  updatedAt: Date;

}
