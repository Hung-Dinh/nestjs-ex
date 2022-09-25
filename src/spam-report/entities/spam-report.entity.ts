import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('spam_report')
export class SpamReport {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: number;

  @Column('bigint')
  userId: number;

  @Column('bigint')
  messageId: number;

  @Column({ 
    nullable: true,
    type: 'text',
   })
  content: string;

  @Column()
  type: string;

  @Column()
  status: string;

  @CreateDateColumn({ name: 'createdAt', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', nullable: true })
  updatedAt: Date;

}
