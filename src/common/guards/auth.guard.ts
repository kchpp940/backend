import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { UserInterface } from '../../shared/interfaces/user.interface';

import { UserIsNotAuthorizedError } from '../../error-handler/errors/user.errors';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RoleResolverService } from '../services/role-resolver.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roleResolverService: RoleResolverService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request & UserInterface>();

    const auth = req.header('Authorization');
    if (!auth) throw new UserIsNotAuthorizedError();

    const [prefix, token] = auth.split(' ');
    if (prefix !== 'Bearer') throw new UserIsNotAuthorizedError();

    const userId = Buffer.from(token, 'base64').toString('ascii');
    req.userId = userId;
    req.roles = this.roleResolverService.resolveRoles(userId);

    return true;
  }
}
