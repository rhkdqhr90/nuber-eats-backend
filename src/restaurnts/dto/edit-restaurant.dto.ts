import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

import { CreateRestaurantInput } from './cretae-restauran.dto';

@InputType()
export class EditRestaurantInput extends PartialType(CreateRestaurantInput) {
  @Field(() => Number)
  restaurantId: number;
}

@ObjectType()
export class EditRestaurantOutput extends CoreOutput {}
