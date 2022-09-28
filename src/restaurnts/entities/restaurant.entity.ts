import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { IsString, IsBoolean, Length, IsOptional } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Category } from './category.entity';
import { User } from 'src/users/entities/user.entity';
@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  @Field(() => String)
  @Column()
  @IsString()
  name: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  coverImage: string;

  @Field(() => String)
  @Column()
  @IsString()
  address: string;

  @Field(() => Category, { nullable: true })
  @ManyToOne(() => Category, (category) => category.restaurant, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category: Category;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.restaurant, { onDelete: 'CASCADE' })
  owner: User;

  @RelationId((restauran: Restaurant) => restauran.owner)
  ownerId: number;
}
