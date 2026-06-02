import type { MetricsService } from '../../modules/metrics/metrics.service';

import { ClientLogsService } from './client-logs.service';

describe('ClientLogsService', () => {
  let service: ClientLogsService;
  let metricsService: { recordClientLogBatch: jest.Mock };

  beforeEach(() => {
    metricsService = {
      recordClientLogBatch: jest.fn(),
    };
    service = new ClientLogsService(metricsService as unknown as MetricsService);
  });

  describe('positive cases', () => {
    it('processWebLog does not throw', () => {
      expect(() =>
        service.processWebLog({
          actions: [{ ctx: 'app', level: 'debug' as never, message: 'test', payload: {} }],
          env: 'test',
          metadata: {} as never,
          timestamp: '2026-05-18T00:00:00.000Z',
          traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
        }),
      ).not.toThrow();
    });

    it('processMobileLog does not throw', () => {
      expect(() =>
        service.processMobileLog({
          payload: { data: 'test' },
          platform: 'ios',
          timestamp: '2026-05-18T00:00:00.000Z',
          traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
        }),
      ).not.toThrow();
    });

    it('processWebLog records accepted metric via batch processing', () => {
      service.processWebLog({
        actions: [{ ctx: 'app', level: 'debug' as never, message: 'test', payload: {} }],
        env: 'test',
        metadata: {} as never,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
      });

      expect(metricsService.recordClientLogBatch).toHaveBeenCalledWith('web', 1, 0);
    });

    it('processMobileLog records accepted metric via batch processing', () => {
      service.processMobileLog({
        payload: { data: 'test' },
        platform: 'ios',
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
      });

      expect(metricsService.recordClientLogBatch).toHaveBeenCalledWith('mobile', 1, 0);
    });

    it('processWebLogBatch returns accepted/failed and records metrics', () => {
      const result = service.processWebLogBatch({
        logs: [
          {
            actions: [{ ctx: 'app', level: 'debug' as never, message: 'test', payload: {} }],
            env: 'test',
            metadata: {} as never,
            timestamp: '2026-05-18T00:00:00.000Z',
            traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
          },
          {
            actions: [{ ctx: 'app', level: 'info' as never, message: 'test2', payload: {} }],
            env: 'test',
            metadata: {} as never,
            timestamp: '2026-05-18T00:00:01.000Z',
            traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6af',
          },
        ],
      });

      expect(result.accepted).toBe(2);
      expect(result.failed).toBe(0);
      expect(metricsService.recordClientLogBatch).toHaveBeenCalledWith('web', 2, 0);
    });

    it('processMobileLogBatch returns accepted/failed and records metrics', () => {
      const result = service.processMobileLogBatch({
        logs: [
          {
            payload: { data: 'test' },
            platform: 'ios',
            timestamp: '2026-05-18T00:00:00.000Z',
            traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
          },
        ],
      });

      expect(result.accepted).toBe(1);
      expect(result.failed).toBe(0);
      expect(metricsService.recordClientLogBatch).toHaveBeenCalledWith('mobile', 1, 0);
    });
  });
});
