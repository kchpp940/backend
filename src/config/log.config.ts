import type { Level } from 'pino';

import { registerAs } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsString } from 'class-validator';

import { parseEnvBoolean, parseEnvStringArray } from '../common/utils/parse-env.util';
import { validateConfig } from '../common/utils/validate-config.util';
import { LogLevelEnum } from './enums/log-level.enum';
import { LogConfigInterface } from './interfaces/log-config.interface';

class LogConfig {
  @IsArray()
  @IsString({ each: true })
  @Transform(parseEnvStringArray)
  LOG_EXCLUDE_ENDPOINTS: string[] = [];

  @IsEnum(LogLevelEnum)
  LOG_LEVEL: Level = LogLevelEnum.info;

  @IsBoolean()
  @Transform(parseEnvBoolean)
  LOG_PRETTY = true;
}

export const logConfig = registerAs<LogConfig, ConfigFactory<LogConfigInterface>>(
  'logConfig',
  (): LogConfigInterface => {
    const config = validateConfig(LogConfig);

    return {
      logExcludeEndpoints: config.LOG_EXCLUDE_ENDPOINTS,
      logLevel: config.LOG_LEVEL,
      logPretty: config.LOG_PRETTY,
    };
  },
);
