import { registerAs } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import { Transform } from 'class-transformer';
import { IsArray, IsString } from 'class-validator';

import { validateConfig } from '../common/utils/validate-config.util';
import { SecurityConfigInterface } from './interfaces/security-config.interface';

class SecurityConfig {
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value as string[];

    if (typeof value === 'string') {
      return JSON.parse(value) as string[];
    }

    return [];
  })
  ADMIN_USER_IDS: string[] = [];

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value as string[];

    if (typeof value === 'string') {
      return JSON.parse(value) as string[];
    }

    return [];
  })
  OPERATOR_USER_IDS: string[] = [];
}

export const securityConfig = registerAs<SecurityConfig, ConfigFactory<SecurityConfigInterface>>(
  'securityConfig',
  (): SecurityConfigInterface => {
    const config = validateConfig(SecurityConfig);

    return {
      adminUserIds: config.ADMIN_USER_IDS,
      operatorUserIds: config.OPERATOR_USER_IDS,
    };
  },
);
