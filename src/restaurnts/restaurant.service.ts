import { Injectable } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { Repository, ILike } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dto/cretae-restauran.dto';

import { User } from 'src/users/entities/user.entity';
import { Category } from './entities/category.entity';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dto/edit-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dto/delete-restaurant.dto';
import { allCategoriesOutput } from './dto/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dto/category.dto';
import { RestaurantsInput, RestaurantsOutput } from './dto/restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dto/restaurant.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dto/search-restaurant.dto';
import { CreateDishInput, CreateDishOutput } from './dto/create-dish.dto';
import { Dish } from './entities/dish.enity';
import { EditDishInput, EditDishOutput } from './dto/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dto/delete-dish.dto';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
  ) {}
  async getOrCreateCategory(name: string): Promise<Category> {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');

    let category = await this.categories.findOne({
      where: { slug: categorySlug },
    });
    if (!category) {
      category = await this.categories.save(
        this.categories.create({ slug: categorySlug, name: categoryName }),
      );
    }
    return category;
  }

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const category = await this.getOrCreateCategory(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;

      await this.restaurants.save(newRestaurant);

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: '??????????????? ?????? ??? ??? ????????????.',
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const restauran = await this.restaurants.findOne({
        where: { id: editRestaurantInput.restaurantId },
        loadRelationIds: true,
      });
      if (!restauran) {
        return {
          ok: false,
          error: '??????????????? ?????? ???????????????.',
        };
      }
      if (owner.id !== restauran.ownerId) {
        return {
          ok: false,
          error: '????????? ?????????????????? ?????? ???????????????.',
        };
      }
      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.getOrCreateCategory(
          editRestaurantInput.categoryName,
        );
      }
      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async DeleteRestaurantInput(
    owner: User,
    deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restauran = await this.restaurants.findOne({
        where: { id: deleteRestaurantInput.restaurantId },
        loadRelationIds: true,
      });
      if (!restauran) {
        return {
          ok: false,
          error: '??????????????? ?????? ???????????????.',
        };
      }
      if (owner.id !== restauran.ownerId) {
        return {
          ok: false,
          error: '????????? ?????????????????? ?????? ???????????????.',
        };
      }
      await this.restaurants.delete(deleteRestaurantInput.restaurantId);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async allCategories(): Promise<allCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return {
        ok: true,
        categories,
      };
    } catch {
      return {
        ok: false,
        error: '??????????????? ??????????????? ??????????????????.',
      };
    }
  }

  countRestaurant(category: Category) {
    return this.restaurants.count({ where: { category: { id: category.id } } });
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({
        where: { slug },
      });
      if (!category) {
        return {
          ok: false,
          error: '??????????????? ?????? ???????????????.',
        };
      }
      const restaurants = await this.restaurants.find({
        where: { category: { id: category.id } },
        take: 5,
        skip: (page - 1) * 10,
        order: {
          isPromoted: 'DESC',
        },
      });
      category.restaurant = restaurants;
      const totalResult = await this.countRestaurant(category);
      return {
        ok: true,
        category,
        totalPage: Math.ceil(totalResult / 10),
        restaurant: category.restaurant,
      };
    } catch {
      return {
        ok: false,
        error: '??????????????? ?????? ???????????????.',
      };
    }
  }

  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [result, totalResult] = await this.restaurants.findAndCount({
        skip: (page - 1) * 10,
        take: 10,
        order: {
          isPromoted: 'DESC',
        },
      });
      return {
        ok: true,
        result,
        totalPage: Math.ceil(totalResult / 10),
        totalResult,
      };
    } catch {
      return {
        ok: false,
        error: '??????????????? ?????? ???????????????.',
      };
    }
  }

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
        relations: ['menu'],
      });
      if (!restaurant) {
        return {
          ok: false,
          error: '??????????????? ?????? ?????? ????????????.',
        };
      }
      return {
        ok: true,
        restaurant,
      };
    } catch {
      return {
        ok: false,
        error: ' ??????????????? ?????? ??? ????????????',
      };
    }
  }
  async searchRestaurantByName({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalResult] = await this.restaurants.findAndCount({
        where: {
          name: ILike(`%${query}%`),
        },
        skip: (page - 1) * 10,
        take: 10,
      });
      return {
        ok: true,
        restaurants,
        totalResult,
        totalPage: Math.ceil(totalResult / 10),
      };
    } catch {
      return {
        ok: false,
        error: '??????????????? ?????? ??? ????????????.',
      };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: createDishInput.restaurantId },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: '??????????????? ?????? ??? ????????????.',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: '????????? ??????????????? ?????? ???????????????.',
        };
      }
      await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: '????????? ?????? ??? ??? ????????????',
      };
    }
  }

  async editDish(
    owner: User,
    eidtDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishes.findOne({
        where: { id: eidtDishInput.disiId },
        relations: ['restaurant'],
      });
      if (!dish) {
        return {
          ok: false,
          error: '????????? ?????? ???????????????.',
        };
      }
      if (dish.restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: '????????? ??????????????? ????????? ?????? ??? ???  ????????????',
        };
      }
      await this.dishes.save([
        {
          id: eidtDishInput.disiId,
          ...eidtDishInput,
        },
      ]);
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne({
        where: { id: dishId },
        relations: ['restaurant'],
      });
      if (!dish) {
        return {
          ok: false,
          error: '????????? ?????? ???????????????.',
        };
      }
      if (dish.restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: '????????? ??????????????? ????????? ?????? ??? ???  ????????????',
        };
      }
      await this.dishes.delete(dishId);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }
}
