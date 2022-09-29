import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Dish } from '../entities/dish.dto';

@InputType()
export class EditDishInput extends PickType(PartialType(Dish), [
  'name',
  'options',
  'description',
  'price',
]) {
  @Field(() => Number)
  disiId: number;
}

@ObjectType()
export class EditDishOutput extends CoreOutput {}
