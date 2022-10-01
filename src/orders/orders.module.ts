import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderReslover } from './orders.resolver';
import { OrderService } from './order.service';
import { Restaurant } from 'src/restaurnts/entities/restaurant.entity';
import { OrderItem } from './entities/order-item.entity';
import { Dish } from 'src/restaurnts/entities/dish.enity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Restaurant, OrderItem, Dish])],
  providers: [OrderService, OrderReslover],
})
export class OrdersModule {}
