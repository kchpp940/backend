import { Test } from '@nestjs/testing';

import { DtoValidationErrors } from '../../error-handler/errors/dto-validation.errors';
import { ClientLogsService } from '../../features/client-logs/client-logs.service';
import { ClientLogsController } from './client-logs.controller';
import { BatchLogItemStatus, BatchLogType } from './dtos/batch-client-log-result.dto';
import { WebLogLevel } from './dtos/web-log-action.dto';

const webLogDto = {
  actions: [{ ctx: 'app', level: WebLogLevel.INFO, message: 'test', payload: {} }],
  env: 'test',
  metadata: {
    browser: 'Chrome',
    browserVersion: '148.0.0.0',
    devicePixelRatio: 2,
    fullUrl: 'http://localhost:5173/',
    language: 'en-US',
    mobile: false,
    os: 'macOS',
    screen: '1728x1117',
    timezone: 'UTC',
    url: '/',
    viewport: '1046x920',
  },
  timestamp: '2026-05-18T00:00:00.000Z',
  traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
};

const mobileLogDto = {
  payload: { data: 'test' },
  platform: 'ios',
  timestamp: '2026-05-18T00:00:00.000Z',
  traceId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
};

const batchDto = {
  mobileLogs: [mobileLogDto],
  webLogs: [webLogDto],
};

describe('ClientLogsController', () => {
  let controller: ClientLogsController;
  let service: { processBatchLogs: jest.Mock; processMobileLog: jest.Mock; processWebLog: jest.Mock };

  beforeEach(async () => {
    service = {
      processBatchLogs: jest.fn(),
      processMobileLog: jest.fn(),
      processWebLog: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [ClientLogsController],
      providers: [{ provide: ClientLogsService, useValue: service }],
    }).compile();

    controller = module.get(ClientLogsController);

    jest.clearAllMocks();
  });

  describe('postBatchLogs', () => {
    const batchResponse = {
      accepted: 2,
      failed: 0,
      results: [
        { index: 0, status: BatchLogItemStatus.ACCEPTED, traceId: webLogDto.traceId, type: BatchLogType.WEB },
        { index: 0, status: BatchLogItemStatus.ACCEPTED, traceId: mobileLogDto.traceId, type: BatchLogType.MOBILE },
      ],
      total: 2,
    };

    describe('negative cases', () => {
      it('propagates DtoValidationErrors for empty batch', () => {
        service.processBatchLogs.mockImplementation(() => {
          throw new DtoValidationErrors({ batch: ['Batch must contain at least 1 log entry'] });
        });

        expect(() => controller.postBatchLogs({})).toThrow(DtoValidationErrors);
      });

      it('propagates DtoValidationErrors for oversized batch', () => {
        service.processBatchLogs.mockImplementation(() => {
          throw new DtoValidationErrors({ batch: ['Batch total size must not exceed 100'] });
        });

        expect(() => controller.postBatchLogs(batchDto)).toThrow(DtoValidationErrors);
      });
    });

    describe('positive cases', () => {
      it('delegates to service and returns batch response', () => {
        service.processBatchLogs.mockReturnValue(batchResponse);

        const result = controller.postBatchLogs(batchDto);

        expect(service.processBatchLogs).toHaveBeenCalledWith(batchDto);
        expect(result).toEqual(batchResponse);
      });

      it('returns response with mixed success and failure results', () => {
        const mixedResponse = {
          accepted: 1,
          failed: 1,
          results: [
            { index: 0, status: BatchLogItemStatus.ACCEPTED, traceId: webLogDto.traceId, type: BatchLogType.WEB },
            {
              error: 's3 error',
              index: 0,
              status: BatchLogItemStatus.FAILED,
              traceId: mobileLogDto.traceId,
              type: BatchLogType.MOBILE,
            },
          ],
          total: 2,
        };

        service.processBatchLogs.mockReturnValue(mixedResponse);

        const result = controller.postBatchLogs(batchDto);

        expect(result.accepted).toBe(1);
        expect(result.failed).toBe(1);
        expect(result.total).toBe(2);
        expect(result.results[1].error).toBe('s3 error');
      });
    });
  });

  describe('postWebLogs', () => {
    describe('negative cases', () => {
      it('propagates service error', () => {
        service.processWebLog.mockImplementation(() => {
          throw new Error('s3 error');
        });

        expect(() => controller.postWebLogs(webLogDto)).toThrow('s3 error');
      });
    });

    describe('positive cases', () => {
      it('checks all levels are existed in WebLogLevel', () => {
        expect(WebLogLevel.LOG).toBe('log');
        expect(WebLogLevel.INFO).toBe('info');
        expect(WebLogLevel.WARN).toBe('warn');
        expect(WebLogLevel.DEBUG).toBe('debug');
        expect(WebLogLevel.ERROR).toBe('error');
        expect(WebLogLevel.CRITICAL).toBe('critical');
      });

      it('delegates to service and returns void', () => {
        const result = controller.postWebLogs(webLogDto);

        expect(service.processWebLog).toHaveBeenCalledWith(webLogDto);
        expect(result).toBeUndefined();
      });
    });
  });

  describe('postMobileLogs', () => {
    describe('negative cases', () => {
      it('propagates service error', () => {
        service.processMobileLog.mockImplementation(() => {
          throw new Error('s3 error');
        });

        expect(() => controller.postMobileLogs(mobileLogDto)).toThrow('s3 error');
      });
    });

    describe('positive cases', () => {
      it('delegates to service and returns void', () => {
        const result = controller.postMobileLogs(mobileLogDto);

        expect(service.processMobileLog).toHaveBeenCalledWith(mobileLogDto);
        expect(result).toBeUndefined();
      });
    });
  });
});
