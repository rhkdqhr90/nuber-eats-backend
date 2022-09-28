import {
  Resolver,
  Args,
  Mutation,
  Query,
  ResolveField,
  Parent,
} from '@nestjs/graphql';

import { AuthUser } from 'src/auth/auto-user.decorator';
import { Role } from 'src/auth/role.decorate';
import { User } from 'src/users/entities/user.entity';
import { allCategoriesOutput } from './dto/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dto/category.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dto/cretae-restauran.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dto/delete-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dto/edit-restaurant.dto';
import { RestaurantInput, RestaurantOutput } from './dto/restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dto/restaurants.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dto/search-restaurant.dto';
import { Category } from './entities/category.entity';

import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurant.service';
@Resolver(() => Restaurant)
export class RestaurntsResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Mutation(() => CreateRestaurantOutput)
  @Role(['Owner'])
  async createRestaurant(
    @AuthUser() authUser: User,
    @Args('Input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    console.log(authUser);
    return await this.restaurantService.createRestaurant(
      authUser,
      createRestaurantInput,
    );
  }

  @Mutation(() => EditRestaurantOutput)
  @Role(['Owner'])
  editRestaurant(
    @AuthUser() owner: User,
    @Args('input') editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantService.editRestaurant(owner, editRestaurantInput);
  }

  @Mutation(() => DeleteRestaurantOutput)
  @Role(['Owner'])
  deleteRestaurant(
    @AuthUser() owner: User,
    @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantService.DeleteRestaurantInput(
      owner,
      deleteRestaurantInput,
    );
  }

  @Query(() => RestaurantsOutput)
  restaurants(
    @Args('input') restaurantsInput: RestaurantsInput,
  ): Promise<RestaurantsOutput> {
    return this.restaurantService.allRestaurants(restaurantsInput);
  }
  @Query(() => RestaurantOutput)
  restaurant(
    @Args('input') restaurantInput: RestaurantInput,
  ): Promise<RestaurantOutput> {
    return this.restaurantService.findRestaurantById(restaurantInput);
  }

  @Query(() => SearchRestaurantOutput)
  searchRestaurant(
    @Args('input') searchRestaurantInput: SearchRestaurantInput,
  ): Promise<SearchRestaurantOutput> {
    return this.restaurantService.searchRestaurantByName(searchRestaurantInput);
  }
}

@Resolver(() => Category)
export class CategoryResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @ResolveField(() => Number)
  restaurantCount(@Parent() categoty: Category): Promise<number> {
    return this.restaurantService.countRestaurant(categoty);
  }

  @Query(() => allCategoriesOutput)
  allCategories(): Promise<allCategoriesOutput> {
    return this.restaurantService.allCategories();
  }
  @Query(() => CategoryOutput)
  category(
    @Args('input') categoryInput: CategoryInput,
  ): Promise<CategoryOutput> {
    return this.restaurantService.findCategoryBySlug(categoryInput);
  }
}
