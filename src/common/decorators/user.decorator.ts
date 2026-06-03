import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { createParamDecorator } from '@nestjs/common';

import type { UserInterface } from '../../shared/interfaces/user.interface';

export const User = (): ParameterDecorator =>
  createParamDecorator((_: unknown, ctx: ExecutionContext): UserInterface => {
    const request: Request & { userId: string } = ctx.switchToHttp().getRequest();

    return { userId: request.userId };
  })();
