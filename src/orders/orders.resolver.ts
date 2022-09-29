import { Args, Mutation, Resolver, Query, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AuthUser } from 'src/auth/auto-user.decorator';
import { Role } from 'src/auth/role.decorate';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dto/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dto/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dto/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dto/get-orders.dto';
import { Order } from './entities/order.entity';
import { OrderService } from './order.service';

const pubsub = new PubSub();

@Resolver(() => Order)
export class OrderReslover {
  constructor(private readonly orderService: OrderService) {}

  @Mutation(() => CreateOrderOutput)
  @Role(['Client'])
  async createOrder(
    @AuthUser() customer: User,
    @Args('input')
    createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    return this.orderService.createOrder(customer, createOrderInput);
  }

  @Query(() => GetOrdersOutput)
  @Role(['Any'])
  async getOrders(
    @AuthUser() user: User,
    @Args('input') getOrdersInput: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    return this.orderService.getOrders(user, getOrdersInput);
  }

  @Query(() => GetOrderOutput)
  @Role(['Any'])
  async getOrder(
    @AuthUser() user: User,
    @Args('input') getOrderInput: GetOrderInput,
  ): Promise<GetOrderOutput> {
    return this.orderService.getOrder(user, getOrderInput);
  }

  @Mutation(() => EditOrderOutput)
  @Role(['Any'])
  async editOrder(
    @AuthUser() user: User,
    @Args('input') editOrderInput: EditOrderInput,
  ): Promise<EditOrderOutput> {
    return await this.orderService.editOrder(user, editOrderInput);
  }

  @Mutation(() => Boolean)
  reay() {
    pubsub.publish('hotpoptas', {
      orderSubscription: 'ready to  doadsfasdfas',
    });
    return true;
  }

  @Subscription(() => String)
  @Role(['Any'])
  orderSubscription(@AuthUser() user: User) {
    console.log(user);
    return pubsub.asyncIterator('hotpoptas');
  }
}
