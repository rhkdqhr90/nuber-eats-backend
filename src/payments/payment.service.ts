import { Injectable } from '@nestjs/common';
import { Cron, Interval, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurnts/entities/restaurant.entity';

import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dto/create-payment.dto';
import { GetPaymentOutput } from './dto/get-payment.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment) private readonly payment: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurant: Repository<Restaurant>,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async createPayment(
    owner: User,
    { transactionId, restaurantId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurant.findOne({
        where: { id: restaurantId },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: '레스토랑을 찾을 수 없습니다',
        };
      }
      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: '자신의 소유의 레스토랑만 선택 가능합니다.',
        };
      }
      await this.payment.save(
        this.payment.create({ transactionId, user: owner, restaurant }),
      );
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: '잘못된 접근입니다.',
      };
    }
  }

  async getPayments(user: User): Promise<GetPaymentOutput> {
    try {
      const payments = await this.payment.find({
        where: { user: { id: user.id } },
      });
      console.log(payments);
      return {
        ok: true,
        payments,
      };
    } catch {
      return {
        ok: false,
        error: '결제내역을 불러올 수 없습니다.',
      };
    }
  }
  @Cron('30 * * * * *', {
    name: 'myjob',
  })
  async checkForPayment() {
    try {
      console.log('asdjkldsafjkleawfkdansdfasf');
      const job = this.schedulerRegistry.getCronJob('myjob');
      job.stop();
      console.log(job);
    } catch (error) {}
  }
}
