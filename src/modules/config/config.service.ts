import type { ConfigType } from '@nestjs/config';

import { Inject, Injectable } from '@nestjs/common';

import { ConfigDiagnosticResponseDto } from '../../api/config/dtos/responses/config-diagnostic-response.dto';
import { appConfig } from '../../config/app.config';
import { databaseConfig } from '../../config/database.config';
import { logConfig } from '../../config/log.config';
import { redisConfig } from '../../config/redis.config';
import { sentryConfig } from '../../config/sentry.config';
import { swaggerConfig } from '../../config/swagger.config';
import { EnvironmentService } from '../environment/environment.service';

@Injectable()
export class ConfigDiagnosticService {
  constructor(
    private readonly environmentService: EnvironmentService,
    @Inject(appConfig.KEY)
    private readonly appConfigValues: ConfigType<typeof appConfig>,
    @Inject(databaseConfig.KEY)
    private readonly databaseConfigValues: ConfigType<typeof databaseConfig>,
    @Inject(redisConfig.KEY)
    private readonly redisConfigValues: ConfigType<typeof redisConfig>,
    @Inject(sentryConfig.KEY)
    private readonly sentryConfigValues: ConfigType<typeof sentryConfig>,
    @Inject(swaggerConfig.KEY)
    private readonly swaggerConfigValues: ConfigType<typeof swaggerConfig>,
    @Inject(logConfig.KEY)
    private readonly logConfigValues: ConfigType<typeof logConfig>,
  ) {}

  getSanitizedConfig(): ConfigDiagnosticResponseDto {
    return {
      appName: this.appConfigValues.appName,
      appVersion: this.appConfigValues.appVersion,
      databaseLogLevels: this.databaseConfigValues.databaseLogLevels,
      environment: this.environmentService.getEnv(),
      logExcludeEndpoints: this.logConfigValues.logExcludeEndpoints,
      logLevel: this.logConfigValues.logLevel,
      logPretty: this.logConfigValues.logPretty,
      port: this.appConfigValues.appPort,
      redisEnabled: this.redisConfigValues.redisEnabled,
      redisHost: this.redisConfigValues.redisHost,
      redisPort: this.redisConfigValues.redisPort,
      sentryEnabled: this.sentryConfigValues.sentryEnabled,
      swaggerEnabled: this.swaggerConfigValues.swaggerEnabled,
      swaggerEndpoint: this.swaggerConfigValues.swaggerEndpoint,
    };
  }
}
