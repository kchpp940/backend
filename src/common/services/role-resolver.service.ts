import type { ConfigType } from '@nestjs/config';

import { Inject, Injectable } from '@nestjs/common';

import { securityConfig } from '../../config/security.config';
import { Role } from '../enums/role.enum';

@Injectable()
export class RoleResolverService {
  constructor(
    @Inject(securityConfig.KEY)
    private readonly securityConfigValues: ConfigType<typeof securityConfig>,
  ) {}

  isAdminConfigured(): boolean {
    return this.securityConfigValues.adminUserIds.length > 0;
  }

  isOperatorConfigured(): boolean {
    return this.securityConfigValues.operatorUserIds.length > 0;
  }

  isPrivilegedRoleConfigured(): boolean {
    return this.isAdminConfigured() || this.isOperatorConfigured();
  }

  resolveRoles(userId: string): Role[] {
    const roles: Role[] = [Role.User];

    if (this.securityConfigValues.operatorUserIds.includes(userId)) {
      roles.push(Role.Operator);
    }

    if (this.securityConfigValues.adminUserIds.includes(userId)) {
      roles.push(Role.Admin);
    }

    return roles;
  }
}
