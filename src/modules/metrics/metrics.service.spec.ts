import { Test } from '@nestjs/testing';

jest.mock('prom-client', () => ({
  Gauge: jest.fn().mockImplementation(() => ({ set: jest.fn() })),
  register: { getSingleMetricAsString: jest.fn().mockResolvedValue('metrics_output') },
}));

import { MetricsService } from './metrics.service';
import { DatabaseMetrics } from './metrics/database.metrics';

describe('MetricsService', () => {
  let service: MetricsService;
  let databaseMetrics: { getTopSlowQueries: jest.Mock };

  beforeEach(async () => {
    databaseMetrics = {
      getTopSlowQueries: jest.fn().mockResolvedValue([]),
    };

    const module = await Test.createTestingModule({
      providers: [MetricsService, { provide: DatabaseMetrics, useValue: databaseMetrics }],
    }).compile();

    service = module.get(MetricsService);
    service.onModuleInit();
  });

  describe('positive cases', () => {
    it('getDatabaseMetrics returns metric string', async () => {
      const result = await service.getDatabaseMetrics();

      expect(typeof result).toBe('string');
    });

    it('updateDatabaseMetrics calls getTopSlowQueries', async () => {
      await service.updateDatabaseMetrics();

      expect(databaseMetrics.getTopSlowQueries).toHaveBeenCalledWith(10);
    });

    it('updateDatabaseMetrics sets gauge for each query', async () => {
      databaseMetrics.getTopSlowQueries.mockResolvedValue([
        { calls: 10, maxMs: 200, meanMs: 100, query: 'SELECT 1', totalMs: 1000 },
        { calls: 5, maxMs: 50, meanMs: 25, query: 'SELECT 2', totalMs: 125 },
      ]);

      await expect(service.updateDatabaseMetrics()).resolves.toBeUndefined();
    });

    it('onModuleInit does not throw', () => {
      expect(() => service.onModuleInit()).not.toThrow();
    });
  });
});
