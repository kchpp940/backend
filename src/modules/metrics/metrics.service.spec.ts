import { register } from 'prom-client';

import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;
  let databaseMetrics: { getTopSlowQueries: jest.Mock };
  let acceptedCounter: { inc: jest.Mock };
  let failedCounter: { inc: jest.Mock };
  let batchSizeGauge: { set: jest.Mock };

  beforeEach(() => {
    register.clear();

    databaseMetrics = {
      getTopSlowQueries: jest.fn().mockResolvedValue([]),
    };

    acceptedCounter = { inc: jest.fn() };
    failedCounter = { inc: jest.fn() };
    batchSizeGauge = { set: jest.fn() };

    service = new MetricsService(
      databaseMetrics as never,
      acceptedCounter as never,
      failedCounter as never,
      batchSizeGauge as never,
    );
  });

  describe('positive cases', () => {
    it('updateDatabaseMetrics calls getTopSlowQueries', async () => {
      service.onModuleInit();
      await service.updateDatabaseMetrics();

      expect(databaseMetrics.getTopSlowQueries).toHaveBeenCalledWith(10);
    });

    it('updateDatabaseMetrics sets gauge for each query', async () => {
      service.onModuleInit();
      databaseMetrics.getTopSlowQueries.mockResolvedValue([
        { calls: 10, maxMs: 200, meanMs: 100, query: 'SELECT 1', totalMs: 1000 },
        { calls: 5, maxMs: 50, meanMs: 25, query: 'SELECT 2', totalMs: 125 },
      ]);

      await expect(service.updateDatabaseMetrics()).resolves.toBeUndefined();
    });

    it('onModuleInit does not throw', () => {
      expect(() => service.onModuleInit()).not.toThrow();
    });

    it('recordClientLogsAccepted increments accepted counter', () => {
      service.recordClientLogsAccepted('web', 5);

      expect(acceptedCounter.inc).toHaveBeenCalledWith({ source: 'web' }, 5);
    });

    it('recordClientLogsFailed increments failed counter', () => {
      service.recordClientLogsFailed('mobile', 2);

      expect(failedCounter.inc).toHaveBeenCalledWith({ source: 'mobile' }, 2);
    });

    it('recordClientLogsBatchSize sets batch size gauge', () => {
      service.recordClientLogsBatchSize('web', 10);

      expect(batchSizeGauge.set).toHaveBeenCalledWith({ source: 'web' }, 10);
    });
  });
});
