import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

import { AllowedRoles } from './role.decorate';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );

    if (!roles) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context).getContext();
    console.log(gqlContext);

    const user = gqlContext['user'].user;
    console.log(user);

    if (user) {
      gqlContext['user'].user = user;
      if (roles.includes('Any')) {
        return true;
      }

      return roles.includes(user.role);
    }
  }
}
