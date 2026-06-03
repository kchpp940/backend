import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { securityConfig } from '../config/security.config';
import { RoleResolverService } from './services/role-resolver.service';

@Module({
  exports: [RoleResolverService],
  imports: [ConfigModule.forFeature(securityConfig)],
  providers: [RoleResolverService],
})
export class CommonModule {}
