import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UsersResolver } from './user.resolver';
import { UsersService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Verification])],
  providers: [UsersResolver, UsersService, ConfigService],
  exports: [UsersService],
})
export class UsersModule {}
