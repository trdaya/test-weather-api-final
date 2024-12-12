import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ulid } from 'ulid';
// eslint-disable-next-line import/no-cycle
import { Location } from '../../location/entities/location.entity';

@Entity('users')
export class User {
  @PrimaryColumn()
  @Index()
  id: string;

  @Column({ unique: true })
  @Index({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: null })
  name: string;

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @ManyToMany(() => Location, location => location.users, { cascade: true })
  @JoinTable({
    name: 'user_favorite_locations',
    joinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'locationId',
      referencedColumnName: 'id',
    },
  })
  locations: Location[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateUlid() {
    if (!this.id) {
      this.id = ulid();
    }
  }
}
