import { Test } from '@nestjs/testing';

import { MetricsService } from '../../modules/metrics/metrics.service';
import { MetricsController } from './metrics.controller';

describe('MetricsController', () => {
  let controller: MetricsController;
  let metricsService: { getDatabaseMetrics: jest.Mock };

  beforeEach(async () => {
    metricsService = {
      getDatabaseMetrics: jest.fn().mockResolvedValue('# HELP db_slow_query_ms\n'),
    };

    const module = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [{ provide: MetricsService, useValue: metricsService }],
    }).compile();

    controller = module.get(MetricsController);
  });

  describe('positive cases', () => {
    it('metrics returns database metrics string', async () => {
      const result = await controller.metrics();

      expect(metricsService.getDatabaseMetrics).toHaveBeenCalled();
      expect(result).toContain('db_slow_query_ms');
    });
  });
});
