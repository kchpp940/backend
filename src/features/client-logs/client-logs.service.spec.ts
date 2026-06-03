import { ClientLogsService } from './client-logs.service';
import { LogSource } from './enums/log-source.enum';

describe('ClientLogsService', () => {
  let service: ClientLogsService;
  let pipeline: { process: jest.Mock };
  let webNormalizer: { normalize: jest.Mock };
  let mobileNormalizer: { normalize: jest.Mock };
  let metricsService: {
    recordClientLogsAccepted: jest.Mock;
    recordClientLogsBatchSize: jest.Mock;
    recordClientLogsFailed: jest.Mock;
  };

  beforeEach(() => {
    pipeline = {
      process: jest.fn().mockResolvedValue({
        accepted: 1,
        failed: 0,
        results: [{ entry: { data: 'test' }, status: 'accepted' }],
        source: LogSource.WEB,
        total: 1,
      }),
    };
    webNormalizer = {
      normalize: jest.fn().mockReturnValue({
        entries: [{ ctx: 'app', level: 'info', message: 'test', payload: {} }],
        source: LogSource.WEB,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
      }),
    };
    mobileNormalizer = {
      normalize: jest.fn().mockReturnValue({
        entries: [{ payload: { data: 'test' }, platform: 'ios' }],
        source: LogSource.MOBILE,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
      }),
    };
    metricsService = {
      recordClientLogsAccepted: jest.fn(),
      recordClientLogsBatchSize: jest.fn(),
      recordClientLogsFailed: jest.fn(),
    };

    service = new ClientLogsService(
      pipeline as never,
      webNormalizer as never,
      mobileNormalizer as never,
      metricsService as never,
    );
  });

  describe('positive cases', () => {
    it('processWebLog delegates to normalizer then pipeline then metrics', async () => {
      const dto = {
        actions: [{ ctx: 'app', level: 'debug' as never, message: 'test', payload: {} }],
        env: 'test',
        metadata: {} as never,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
      };

      await service.processWebLog(dto);

      expect(webNormalizer.normalize).toHaveBeenCalledWith(dto);
      expect(pipeline.process).toHaveBeenCalledWith(webNormalizer.normalize());
      expect(metricsService.recordClientLogsBatchSize).toHaveBeenCalledWith(LogSource.WEB, 1);
      expect(metricsService.recordClientLogsAccepted).toHaveBeenCalledWith(LogSource.WEB, 1);
      expect(metricsService.recordClientLogsFailed).toHaveBeenCalledWith(LogSource.WEB, 0);
    });

    it('processWebLog returns only accepted/failed/results (no source/total)', async () => {
      const dto = {
        actions: [{ ctx: 'app', level: 'debug' as never, message: 'test', payload: {} }],
        env: 'test',
        metadata: {} as never,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
      };

      const result = await service.processWebLog(dto);

      expect(result).toEqual({
        accepted: 1,
        failed: 0,
        results: [{ entry: { data: 'test' }, status: 'accepted' }],
      });
      expect(result).not.toHaveProperty('source');
      expect(result).not.toHaveProperty('total');
    });

    it('processMobileLog delegates to normalizer then pipeline then metrics', async () => {
      const dto = {
        payload: { data: 'test' },
        platform: 'ios',
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
      };

      pipeline.process.mockResolvedValue({
        accepted: 1,
        failed: 0,
        results: [{ entry: { data: 'test' }, status: 'accepted' }],
        source: LogSource.MOBILE,
        total: 1,
      });

      await service.processMobileLog(dto);

      expect(mobileNormalizer.normalize).toHaveBeenCalledWith(dto);
      expect(pipeline.process).toHaveBeenCalledWith(mobileNormalizer.normalize());
      expect(metricsService.recordClientLogsBatchSize).toHaveBeenCalledWith(LogSource.MOBILE, 1);
      expect(metricsService.recordClientLogsAccepted).toHaveBeenCalledWith(LogSource.MOBILE, 1);
      expect(metricsService.recordClientLogsFailed).toHaveBeenCalledWith(LogSource.MOBILE, 0);
    });

    it('processMobileLog returns only accepted/failed/results (no source/total)', async () => {
      const dto = {
        payload: { data: 'test' },
        platform: 'ios',
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
      };

      pipeline.process.mockResolvedValue({
        accepted: 1,
        failed: 0,
        results: [{ entry: { data: 'test' }, status: 'accepted' }],
        source: LogSource.MOBILE,
        total: 1,
      });

      const result = await service.processMobileLog(dto);

      expect(result).toEqual({
        accepted: 1,
        failed: 0,
        results: [{ entry: { data: 'test' }, status: 'accepted' }],
      });
      expect(result).not.toHaveProperty('source');
      expect(result).not.toHaveProperty('total');
    });
  });
});
