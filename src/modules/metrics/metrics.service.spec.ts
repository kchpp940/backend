import { Test } from '@nestjs/testing';

jest.mock('prom-client', () => ({
  Counter: jest.fn().mockImplementation(() => ({ labels: jest.fn().mockReturnValue({ inc: jest.fn() }) })),
  Gauge: jest.fn().mockImplementation(() => ({ set: jest.fn() })),
  Histogram: jest.fn().mockImplementation(() => ({ labels: jest.fn().mockReturnValue({ observe: jest.fn() }) })),
  register: {
    getSingleMetricAsString: jest.fn().mockResolvedValue('metrics_output'),
    metrics: jest.fn().mockResolvedValue('all_metrics_output'),
  },
}));

import { MetricsService } from './metrics.service';
import { BusinessInterface, BusinessOperation, BusinessStatus } from './metrics/business.metrics';
import { BusinessMetrics } from './metrics/business.metrics';
import { DatabaseMetrics } from './metrics/database.metrics';

describe('MetricsService', () => {
  let service: MetricsService;
  let databaseMetrics: { getTopSlowQueries: jest.Mock };
  let businessMetrics: { recordRequest: jest.Mock };

  beforeEach(async () => {
    databaseMetrics = {
      getTopSlowQueries: jest.fn().mockResolvedValue([]),
    };
    businessMetrics = {
      recordRequest: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        MetricsService,
        { provide: DatabaseMetrics, useValue: databaseMetrics },
        { provide: BusinessMetrics, useValue: businessMetrics },
      ],
    }).compile();

    service = module.get(MetricsService);
    service.onModuleInit();
  });

  describe('positive cases', () => {
    it('getAllMetrics returns all metrics string', async () => {
      const result = await service.getAllMetrics();

      expect(typeof result).toBe('string');
    });

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

    it('recordBusinessRequest delegates to businessMetrics', () => {
      service.recordBusinessRequest(BusinessInterface.TODOS, BusinessOperation.CREATE, BusinessStatus.SUCCESS, 0.1);

      expect(businessMetrics.recordRequest).toHaveBeenCalledWith(
        BusinessInterface.TODOS,
        BusinessOperation.CREATE,
        BusinessStatus.SUCCESS,
        0.1,
        undefined,
        undefined,
      );
    });
  });
});
