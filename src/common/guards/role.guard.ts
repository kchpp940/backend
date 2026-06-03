import type { CanActivate, ExecutionContext } from '@nestjs/common';

import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import type { UserInterface } from '../../shared/interfaces/user.interface';

import { AdminNotConfiguredError, UserInsufficientPermissionsError } from '../../error-handler/errors/user.errors';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { RoleResolverService } from '../services/role-resolver.service';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roleResolverService: RoleResolverService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const requiresPrivilegedRole = requiredRoles.some((role) => role === Role.Admin || role === Role.Operator);

    if (requiresPrivilegedRole && !this.roleResolverService.isPrivilegedRoleConfigured()) {
      throw new AdminNotConfiguredError();
    }

    const req = context.switchToHttp().getRequest<Request & UserInterface>();
    const userRoles = req.roles || [];

    if (userRoles.length === 0) {
      throw new UserInsufficientPermissionsError('User has no assigned roles');
    }

    const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      const requiredRoleNames = requiredRoles.join(' or ');
      const userRoleNames = userRoles.join(', ');
      throw new UserInsufficientPermissionsError(`User requires ${requiredRoleNames} role(s) but has ${userRoleNames}`);
    }

    return true;
  }
}
