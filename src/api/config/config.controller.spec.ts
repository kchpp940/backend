import { Test } from '@nestjs/testing';

import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { ConfigDiagnosticService } from '../../modules/config/config.service';
import { ConfigController } from './config.controller';

describe('ConfigController', () => {
  let controller: ConfigController;
  let configDiagnosticService: { getSanitizedConfig: jest.Mock };

  beforeEach(async () => {
    configDiagnosticService = {
      getSanitizedConfig: jest.fn().mockReturnValue({
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
      }),
    };

    const module = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [{ provide: ConfigDiagnosticService, useValue: configDiagnosticService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get(ConfigController);
  });

  describe('positive cases', () => {
    it('getDiagnostic calls configDiagnosticService.getSanitizedConfig', () => {
      const result = controller.getDiagnostic();

      expect(configDiagnosticService.getSanitizedConfig).toHaveBeenCalled();
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
  });
});
