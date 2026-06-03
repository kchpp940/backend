import type { ExecutionContext } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { AdminNotConfiguredError, UserInsufficientPermissionsError } from '../../error-handler/errors/user.errors';
import { Role } from '../enums/role.enum';
import { RoleResolverService } from '../services/role-resolver.service';
import { RoleGuard } from './role.guard';

const makeRoleResolver = (overrides?: { adminUserIds?: string[]; operatorUserIds?: string[] }): RoleResolverService => {
  const securityConfigValues = {
    adminUserIds: overrides?.adminUserIds ?? ['admin-1'],
    operatorUserIds: overrides?.operatorUserIds ?? ['operator-1'],
  };

  return new RoleResolverService(securityConfigValues);
};

const makeContext = (reflector: Reflector, roles?: Role[], userRoles?: Role[]): ExecutionContext => {
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);

  const req = {
    roles: userRoles,
  };

  return {
    getClass: jest.fn(),
    getHandler: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(req),
    }),
  } as unknown as ExecutionContext;
};

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let reflector: Reflector;
  let roleResolver: RoleResolverService;

  beforeEach(() => {
    reflector = new Reflector();
    roleResolver = makeRoleResolver();
    guard = new RoleGuard(reflector, roleResolver);
  });

  describe('negative cases', () => {
    it('throws UserInsufficientPermissionsError when user has no required roles', () => {
      const ctx = makeContext(reflector, [Role.Admin], [Role.User]);

      expect(() => guard.canActivate(ctx)).toThrow(UserInsufficientPermissionsError);
    });

    it('throws UserInsufficientPermissionsError when user has none of the required roles', () => {
      const ctx = makeContext(reflector, [Role.Admin, Role.Operator], [Role.User]);

      expect(() => guard.canActivate(ctx)).toThrow(UserInsufficientPermissionsError);
    });

    it('throws UserInsufficientPermissionsError when user has no roles', () => {
      const ctx = makeContext(reflector, [Role.Admin], undefined);

      expect(() => guard.canActivate(ctx)).toThrow(UserInsufficientPermissionsError);
    });

    it('throws UserInsufficientPermissionsError when user has empty roles', () => {
      const ctx = makeContext(reflector, [Role.Admin], []);

      expect(() => guard.canActivate(ctx)).toThrow(UserInsufficientPermissionsError);
    });

    it('includes descriptive message about required vs actual roles', () => {
      const ctx = makeContext(reflector, [Role.Admin, Role.Operator], [Role.User]);

      expect(() => guard.canActivate(ctx)).toThrow('User requires admin or operator role(s) but has user');
    });

    it('includes descriptive message when user has no roles', () => {
      const ctx = makeContext(reflector, [Role.Admin], []);

      expect(() => guard.canActivate(ctx)).toThrow('User has no assigned roles');
    });
  });

  describe('default deny when not configured', () => {
    it('throws AdminNotConfiguredError when Admin role required but no admin user IDs configured', () => {
      const unconfiguredResolver = makeRoleResolver({ adminUserIds: [], operatorUserIds: [] });
      const unconfiguredGuard = new RoleGuard(reflector, unconfiguredResolver);
      const ctx = makeContext(reflector, [Role.Admin], [Role.User]);

      expect(() => unconfiguredGuard.canActivate(ctx)).toThrow(AdminNotConfiguredError);
    });

    it('throws AdminNotConfiguredError when Operator role required but no operator user IDs configured', () => {
      const unconfiguredResolver = makeRoleResolver({ adminUserIds: [], operatorUserIds: [] });
      const unconfiguredGuard = new RoleGuard(reflector, unconfiguredResolver);
      const ctx = makeContext(reflector, [Role.Operator], [Role.User]);

      expect(() => unconfiguredGuard.canActivate(ctx)).toThrow(AdminNotConfiguredError);
    });

    it('throws AdminNotConfiguredError for Admin+Operator roles when neither configured', () => {
      const unconfiguredResolver = makeRoleResolver({ adminUserIds: [], operatorUserIds: [] });
      const unconfiguredGuard = new RoleGuard(reflector, unconfiguredResolver);
      const ctx = makeContext(reflector, [Role.Admin, Role.Operator], [Role.User]);

      expect(() => unconfiguredGuard.canActivate(ctx)).toThrow(AdminNotConfiguredError);
    });

    it('does not throw AdminNotConfiguredError when only User role is required', () => {
      const unconfiguredResolver = makeRoleResolver({ adminUserIds: [], operatorUserIds: [] });
      const unconfiguredGuard = new RoleGuard(reflector, unconfiguredResolver);
      const ctx = makeContext(reflector, [Role.User], [Role.User]);

      expect(unconfiguredGuard.canActivate(ctx)).toBe(true);
    });

    it('does not throw AdminNotConfiguredError when admin is configured', () => {
      const configuredResolver = makeRoleResolver({ adminUserIds: ['admin-1'], operatorUserIds: [] });
      const configuredGuard = new RoleGuard(reflector, configuredResolver);
      const ctx = makeContext(reflector, [Role.Admin], [Role.User, Role.Admin]);

      expect(configuredGuard.canActivate(ctx)).toBe(true);
    });

    it('does not throw AdminNotConfiguredError when operator is configured', () => {
      const configuredResolver = makeRoleResolver({ adminUserIds: [], operatorUserIds: ['operator-1'] });
      const configuredGuard = new RoleGuard(reflector, configuredResolver);
      const ctx = makeContext(reflector, [Role.Operator], [Role.User, Role.Operator]);

      expect(configuredGuard.canActivate(ctx)).toBe(true);
    });
  });

  describe('positive cases', () => {
    it('returns true when no roles are required', () => {
      const ctx = makeContext(reflector, undefined, [Role.User]);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when empty roles array is required', () => {
      const ctx = makeContext(reflector, [], [Role.User]);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when user has required admin role', () => {
      const ctx = makeContext(reflector, [Role.Admin], [Role.User, Role.Admin]);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when user has required operator role', () => {
      const ctx = makeContext(reflector, [Role.Operator], [Role.User, Role.Operator]);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when user has one of multiple required roles', () => {
      const ctx = makeContext(reflector, [Role.Admin, Role.Operator], [Role.User, Role.Operator]);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when user has all required roles', () => {
      const ctx = makeContext(reflector, [Role.Admin, Role.Operator], [Role.User, Role.Admin, Role.Operator]);

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });
});
