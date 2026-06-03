import { Test } from '@nestjs/testing';

import { appConfig } from '../../config/app.config';
import { databaseConfig } from '../../config/database.config';
import { logConfig } from '../../config/log.config';
import { redisConfig } from '../../config/redis.config';
import { sentryConfig } from '../../config/sentry.config';
import { swaggerConfig } from '../../config/swagger.config';
import { EnvironmentService } from '../environment/environment.service';
import { ConfigDiagnosticService } from './config.service';

const makeService = async (overrides?: {
  app?: Record<string, unknown>;
  database?: Record<string, unknown>;
  log?: Record<string, unknown>;
  redis?: Record<string, unknown>;
  sentry?: Record<string, unknown>;
  swagger?: Record<string, unknown>;
}): Promise<ConfigDiagnosticService> => {
  const module = await Test.createTestingModule({
    providers: [
      ConfigDiagnosticService,
      {
        provide: EnvironmentService,
        useValue: {
          getEnv: jest.fn().mockReturnValue('test'),
        },
      },
      {
        provide: appConfig.KEY,
        useValue: {
          appName: 'test-app',
          appPort: 3000,
          appVersion: '1.0.0',
          ...overrides?.app,
        },
      },
      {
        provide: databaseConfig.KEY,
        useValue: {
          databaseLogLevels: ['error'],
          ...overrides?.database,
        },
      },
      {
        provide: logConfig.KEY,
        useValue: {
          logExcludeEndpoints: ['/health'],
          logLevel: 'info',
          logPretty: true,
          ...overrides?.log,
        },
      },
      {
        provide: redisConfig.KEY,
        useValue: {
          redisEnabled: true,
          redisHost: 'localhost',
          redisPort: 6379,
          ...overrides?.redis,
        },
      },
      {
        provide: sentryConfig.KEY,
        useValue: {
          sentryEnabled: true,
          ...overrides?.sentry,
        },
      },
      {
        provide: swaggerConfig.KEY,
        useValue: {
          swaggerEnabled: true,
          swaggerEndpoint: 'docs',
          ...overrides?.swagger,
        },
      },
    ],
  }).compile();

  return module.get(ConfigDiagnosticService);
};

describe('ConfigDiagnosticService', () => {
  describe('getSanitizedConfig', () => {
    it('returns only whitelisted configuration fields', async () => {
      const service = await makeService();

      const result = service.getSanitizedConfig();

      expect(result).toEqual({
        appName: 'test-app',
        appVersion: '1.0.0',
        databaseLogLevels: ['error'],
        environment: 'test',
        logExcludeEndpoints: ['/health'],
        logLevel: 'info',
        logPretty: true,
        port: 3000,
        redisEnabled: true,
        redisHost: 'localhost',
        redisPort: 6379,
        sentryEnabled: true,
        swaggerEnabled: true,
        swaggerEndpoint: 'docs',
      });
    });

    it('never includes sensitive fields even if available in config', async () => {
      const service = await makeService({
        database: {
          databasePassword: 'super-secret',
          databaseUser: 'should-not-appear',
        },
        sentry: {
          sentryDsn: 'https://secret@example.com/123',
        },
      });

      const result = service.getSanitizedConfig();

      expect(result).not.toHaveProperty('databasePassword');
      expect(result).not.toHaveProperty('databaseUser');
      expect(result).not.toHaveProperty('sentryDsn');
      expect(Object.keys(result)).toEqual([
        'appName',
        'appVersion',
        'databaseLogLevels',
        'environment',
        'logExcludeEndpoints',
        'logLevel',
        'logPretty',
        'port',
        'redisEnabled',
        'redisHost',
        'redisPort',
        'sentryEnabled',
        'swaggerEnabled',
        'swaggerEndpoint',
      ]);
    });

    it('returns correct environment', async () => {
      const service = await makeService();

      const result = service.getSanitizedConfig();

      expect(result.environment).toBe('test');
    });

    it('returns Redis disabled state correctly', async () => {
      const service = await makeService({
        redis: { redisEnabled: false },
      });

      const result = service.getSanitizedConfig();

      expect(result.redisEnabled).toBe(false);
    });

    it('returns Swagger disabled state correctly', async () => {
      const service = await makeService({
        swagger: { swaggerEnabled: false },
      });

      const result = service.getSanitizedConfig();

      expect(result.swaggerEnabled).toBe(false);
    });

    it('filters response through whitelist even with extra fields', async () => {
      const service = await makeService({
        app: {
          extraField: 'should-be-filtered-out',
        },
      });

      const result = service.getSanitizedConfig();

      expect(result).not.toHaveProperty('extraField');
    });
  });
});
