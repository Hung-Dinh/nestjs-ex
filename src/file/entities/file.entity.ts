import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: number;

  @Column({
    type: 'bigint',
  })
  ownerId: number;

  @Column()
  type: string;

  @Column()
  driver: string;

  @Column()
  path: string;

  @Column({
    nullable: true,
  })
  ipfsPath: string;

  @Column({
    nullable: true,
  })
  s3key: string;

  @Column({
    nullable: true,
  })
  bucket: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  fileInfo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
