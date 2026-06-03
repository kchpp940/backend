import type { ExecutionContext } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { UserIsNotAuthorizedError } from '../../error-handler/errors/user.errors';
import { Role } from '../enums/role.enum';
import { RoleResolverService } from '../services/role-resolver.service';
import { AuthGuard } from './auth.guard';

const makeContext = (reflector: Reflector, auth?: string, isPublic = false): ExecutionContext => {
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);

  return {
    getClass: jest.fn(),
    getHandler: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ header: jest.fn().mockReturnValue(auth) }),
    }),
  } as unknown as ExecutionContext;
};

const makeRoleResolver = (overrides?: { adminUserIds?: string[]; operatorUserIds?: string[] }): RoleResolverService => {
  const securityConfigValues = {
    adminUserIds: overrides?.adminUserIds ?? [],
    operatorUserIds: overrides?.operatorUserIds ?? [],
  };

  return new RoleResolverService(securityConfigValues);
};

const makeGuard = (overrides?: {
  adminUserIds?: string[];
  operatorUserIds?: string[];
}): { guard: AuthGuard; reflector: Reflector; roleResolver: RoleResolverService } => {
  const reflector = new Reflector();
  const roleResolver = makeRoleResolver(overrides);

  return {
    guard: new AuthGuard(reflector, roleResolver),
    reflector,
    roleResolver,
  };
};

describe('AuthGuard', () => {
  describe('negative cases', () => {
    it('throws when Authorization header is absent', () => {
      const { guard, reflector } = makeGuard();
      const ctx = makeContext(reflector, undefined);

      expect(() => guard.canActivate(ctx)).toThrow(UserIsNotAuthorizedError);
    });

    it('throws when Authorization prefix is not Bearer', () => {
      const { guard, reflector } = makeGuard();
      const ctx = makeContext(reflector, 'Basic dXNlcjE=');

      expect(() => guard.canActivate(ctx)).toThrow(UserIsNotAuthorizedError);
    });
  });

  describe('positive cases', () => {
    it('returns true for public routes without checking auth', () => {
      const { guard, reflector } = makeGuard();
      const ctx = makeContext(reflector, undefined, true);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('sets userId on request from Bearer token', () => {
      const { guard, reflector } = makeGuard();
      const userId = 'user-123';
      const token = Buffer.from(userId).toString('base64');

      const req = { header: jest.fn().mockReturnValue(`Bearer ${token}`) } as unknown as Record<string, unknown>;
      const ctx = {
        getClass: jest.fn(),
        getHandler: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({ getRequest: jest.fn().mockReturnValue(req) }),
      } as unknown as ExecutionContext;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(req.userId).toBe(userId);
    });

    it('decodes base64 token to ASCII userId', () => {
      const { guard, reflector } = makeGuard();
      const userId = 'special-user@example.com';
      const token = Buffer.from(userId).toString('base64');

      const req = { header: jest.fn().mockReturnValue(`Bearer ${token}`) } as unknown as Record<string, unknown>;
      const ctx = {
        getClass: jest.fn(),
        getHandler: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({ getRequest: jest.fn().mockReturnValue(req) }),
      } as unknown as ExecutionContext;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      guard.canActivate(ctx);

      expect(req.userId).toBe(userId);
    });

    it('assigns User role to regular users', () => {
      const { guard, reflector } = makeGuard({
        adminUserIds: ['admin-id'],
        operatorUserIds: ['operator-id'],
      });
      const userId = 'regular-user';
      const token = Buffer.from(userId).toString('base64');

      const req = { header: jest.fn().mockReturnValue(`Bearer ${token}`) } as unknown as Record<string, unknown>;
      const ctx = {
        getClass: jest.fn(),
        getHandler: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({ getRequest: jest.fn().mockReturnValue(req) }),
      } as unknown as ExecutionContext;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      guard.canActivate(ctx);

      expect(req.roles).toEqual([Role.User]);
    });

    it('assigns Operator role to operator users', () => {
      const operatorId = 'operator-id';
      const { guard, reflector } = makeGuard({
        adminUserIds: ['admin-id'],
        operatorUserIds: [operatorId],
      });
      const token = Buffer.from(operatorId).toString('base64');

      const req = { header: jest.fn().mockReturnValue(`Bearer ${token}`) } as unknown as Record<string, unknown>;
      const ctx = {
        getClass: jest.fn(),
        getHandler: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({ getRequest: jest.fn().mockReturnValue(req) }),
      } as unknown as ExecutionContext;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      guard.canActivate(ctx);

      expect(req.roles).toContain(Role.User);
      expect(req.roles).toContain(Role.Operator);
    });

    it('assigns Admin role to admin users', () => {
      const adminId = 'admin-id';
      const { guard, reflector } = makeGuard({
        adminUserIds: [adminId],
        operatorUserIds: ['operator-id'],
      });
      const token = Buffer.from(adminId).toString('base64');

      const req = { header: jest.fn().mockReturnValue(`Bearer ${token}`) } as unknown as Record<string, unknown>;
      const ctx = {
        getClass: jest.fn(),
        getHandler: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({ getRequest: jest.fn().mockReturnValue(req) }),
      } as unknown as ExecutionContext;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      guard.canActivate(ctx);

      expect(req.roles).toContain(Role.User);
      expect(req.roles).toContain(Role.Admin);
    });

    it('assigns multiple roles to user who is both admin and operator', () => {
      const userId = 'super-user';
      const { guard, reflector } = makeGuard({
        adminUserIds: [userId],
        operatorUserIds: [userId],
      });
      const token = Buffer.from(userId).toString('base64');

      const req = { header: jest.fn().mockReturnValue(`Bearer ${token}`) } as unknown as Record<string, unknown>;
      const ctx = {
        getClass: jest.fn(),
        getHandler: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({ getRequest: jest.fn().mockReturnValue(req) }),
      } as unknown as ExecutionContext;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      guard.canActivate(ctx);

      expect(req.roles).toEqual([Role.User, Role.Operator, Role.Admin]);
    });

    it('delegates role resolution to RoleResolverService', () => {
      const { guard, reflector, roleResolver } = makeGuard();
      const userId = 'user-456';
      const token = Buffer.from(userId).toString('base64');
      const resolveSpy = jest.spyOn(roleResolver, 'resolveRoles');

      const req = { header: jest.fn().mockReturnValue(`Bearer ${token}`) } as unknown as Record<string, unknown>;
      const ctx = {
        getClass: jest.fn(),
        getHandler: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({ getRequest: jest.fn().mockReturnValue(req) }),
      } as unknown as ExecutionContext;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      guard.canActivate(ctx);

      expect(resolveSpy).toHaveBeenCalledWith(userId);
    });
  });
});
