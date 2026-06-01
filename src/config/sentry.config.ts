import { registerAs } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsString } from 'class-validator';

import { parseEnvBoolean, parseEnvStringArray } from '../common/utils/parse-env.util';
import { validateConfig } from '../common/utils/validate-config.util';
import { SentryConfigInterface } from './interfaces/sentry-config.interface';

class SentryConfig {
  @IsString()
  SENTRY_DSN: string;

  @IsBoolean()
  @Transform(parseEnvBoolean)
  SENTRY_ENABLED = true;

  @IsArray()
  @IsString({ each: true })
  @Transform(parseEnvStringArray)
  SENTRY_IGNORED_ERRORS: string[] = [];
}

export const sentryConfig = registerAs<SentryConfig, ConfigFactory<SentryConfigInterface>>(
  'sentryConfig',
  (): SentryConfigInterface => {
    const config = validateConfig(SentryConfig);

    return {
      sentryDsn: config.SENTRY_DSN,
      sentryEnabled: config.SENTRY_ENABLED,
      sentryIgnoredErrors: config.SENTRY_IGNORED_ERRORS,
    };
  },
);
