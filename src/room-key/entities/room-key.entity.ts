import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('room_key')
export class RoomKey {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: number;

  @Column()
  roomId: number;

  @Column()
  sharedKey: string;

  @Column()
  publicKey: string;

  @Column()
  privateKey: string;

  @Column()
  side: string;

  @Column()
  iv: string;

  @CreateDateColumn({ name: 'createdAt', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', nullable: true })
  updatedAt: Date;
}
