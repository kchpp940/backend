import { registerAs } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsNumber, IsString } from 'class-validator';

import { getDatabaseUrl } from '../../database-manager/generate-url';
import { LogLevel } from '../../database-manager/generated/internal/prismaNamespace';
import { parseEnvBoolean, parseEnvTypedArray } from '../common/utils/parse-env.util';
import { validateConfig } from '../common/utils/validate-config.util';
import { DatabaseConfigInterface } from './interfaces/database-config.interface';

const validLogLevels: readonly LogLevel[] = ['info', 'query', 'warn', 'error'] as const;

class DatabaseConfig {
  @IsBoolean()
  @Transform(parseEnvBoolean)
  DATABASE_FAIL_FAST = true;

  @IsArray()
  @IsIn(validLogLevels, { each: true })
  @Transform((params) =>
    parseEnvTypedArray<LogLevel>(
      params,
      (item): item is LogLevel => typeof item === 'string' && validLogLevels.includes(item as LogLevel),
      {
        formatExample: '["query", "error", "info", "warn"]',
        itemType: 'LogLevel',
      },
    ),
  )
  @Type(() => String)
  DATABASE_LOG_LEVELS: LogLevel[] = [];

  @IsString()
  DATABASE_NAME: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  DATABASE_PORT: number;

  @IsString()
  DATABASE_USER: string;
}

export const databaseConfig = registerAs<DatabaseConfig, ConfigFactory<DatabaseConfigInterface>>(
  'databaseConfig',
  (): DatabaseConfigInterface => {
    const config = validateConfig(DatabaseConfig);

    return {
      databaseFailFast: config.DATABASE_FAIL_FAST,
      databaseLogLevels: config.DATABASE_LOG_LEVELS,
      databasePassword: config.DATABASE_PASSWORD,
      databaseUrl: getDatabaseUrl(),
      databaseUser: config.DATABASE_USER,
    };
  },
);
