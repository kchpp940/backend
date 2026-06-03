import { Role } from '../enums/role.enum';
import { RoleResolverService } from './role-resolver.service';

const makeService = (overrides?: { adminUserIds?: string[]; operatorUserIds?: string[] }): RoleResolverService => {
  const securityConfigValues = {
    adminUserIds: overrides?.adminUserIds ?? ['admin-1', 'admin-2'],
    operatorUserIds: overrides?.operatorUserIds ?? ['operator-1'],
  };

  return new RoleResolverService(securityConfigValues);
};

describe('RoleResolverService', () => {
  describe('configuration checks', () => {
    it('returns true for isAdminConfigured when admin users are configured', () => {
      const service = makeService({ adminUserIds: ['admin-1'] });

      expect(service.isAdminConfigured()).toBe(true);
    });

    it('returns false for isAdminConfigured when no admin users are configured', () => {
      const service = makeService({ adminUserIds: [] });

      expect(service.isAdminConfigured()).toBe(false);
    });

    it('returns true for isOperatorConfigured when operator users are configured', () => {
      const service = makeService({ operatorUserIds: ['operator-1'] });

      expect(service.isOperatorConfigured()).toBe(true);
    });

    it('returns false for isOperatorConfigured when no operator users are configured', () => {
      const service = makeService({ operatorUserIds: [] });

      expect(service.isOperatorConfigured()).toBe(false);
    });

    it('returns true for isPrivilegedRoleConfigured when admin is configured', () => {
      const service = makeService({ adminUserIds: ['admin-1'], operatorUserIds: [] });

      expect(service.isPrivilegedRoleConfigured()).toBe(true);
    });

    it('returns true for isPrivilegedRoleConfigured when operator is configured', () => {
      const service = makeService({ adminUserIds: [], operatorUserIds: ['operator-1'] });

      expect(service.isPrivilegedRoleConfigured()).toBe(true);
    });

    it('returns false for isPrivilegedRoleConfigured when neither is configured', () => {
      const service = makeService({ adminUserIds: [], operatorUserIds: [] });

      expect(service.isPrivilegedRoleConfigured()).toBe(false);
    });
  });

  describe('role resolution', () => {
    it('assigns User role to all users', () => {
      const service = makeService();

      const roles = service.resolveRoles('unknown-user');

      expect(roles).toEqual([Role.User]);
    });

    it('assigns Operator role to operator users', () => {
      const service = makeService();

      const roles = service.resolveRoles('operator-1');

      expect(roles).toContain(Role.User);
      expect(roles).toContain(Role.Operator);
    });

    it('assigns Admin role to admin users', () => {
      const service = makeService();

      const roles = service.resolveRoles('admin-1');

      expect(roles).toContain(Role.User);
      expect(roles).toContain(Role.Admin);
    });

    it('assigns multiple roles to user who is both admin and operator', () => {
      const service = makeService({
        adminUserIds: ['super-user'],
        operatorUserIds: ['super-user'],
      });

      const roles = service.resolveRoles('super-user');

      expect(roles).toEqual([Role.User, Role.Operator, Role.Admin]);
    });

    it('returns correct roles when config is empty', () => {
      const service = makeService({ adminUserIds: [], operatorUserIds: [] });

      const roles = service.resolveRoles('any-user');

      expect(roles).toEqual([Role.User]);
    });
  });
});
