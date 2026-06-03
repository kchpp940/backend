import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { createParamDecorator } from '@nestjs/common';

import type { UserInterface } from '../../shared/interfaces/user.interface';

import { Role } from '../enums/role.enum';

export const User = (): ParameterDecorator =>
  createParamDecorator((_: unknown, ctx: ExecutionContext): UserInterface => {
    const request: Request & { roles?: Role[]; userId: string } = ctx.switchToHttp().getRequest();

    return {
      roles: request.roles ?? [Role.User],
      userId: request.userId,
    };
  })();
