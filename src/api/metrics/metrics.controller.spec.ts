import { Test } from '@nestjs/testing';

import { MetricsService } from '../../modules/metrics/metrics.service';
import { MetricsController } from './metrics.controller';

describe('MetricsController', () => {
  let controller: MetricsController;
  let metricsService: { getAllMetrics: jest.Mock; getDatabaseMetrics: jest.Mock };

  beforeEach(async () => {
    metricsService = {
      getAllMetrics: jest.fn().mockResolvedValue('# HELP all metrics\n'),
      getDatabaseMetrics: jest.fn().mockResolvedValue('# HELP db_slow_query_ms\n'),
    };

    const module = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [{ provide: MetricsService, useValue: metricsService }],
    }).compile();

    controller = module.get(MetricsController);
  });

  describe('positive cases', () => {
    it('getAllMetrics returns all metrics string', async () => {
      const result = await controller.getAllMetrics();

      expect(metricsService.getAllMetrics).toHaveBeenCalled();
      expect(result).toContain('metrics');
    });

    it('getDatabaseMetrics returns database metrics string', async () => {
      const result = await controller.getDatabaseMetrics();

      expect(metricsService.getDatabaseMetrics).toHaveBeenCalled();
      expect(result).toContain('db_slow_query_ms');
    });
  });
});
