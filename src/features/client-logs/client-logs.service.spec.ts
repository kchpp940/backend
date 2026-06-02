import { BatchLogItemStatus, BatchLogType } from '../../api/client-logs/dtos/batch-client-log-result.dto';
import { MAX_BATCH_SIZE } from '../../api/client-logs/dtos/batch-client-logs.dto';
import { WebLogLevel } from '../../api/client-logs/dtos/web-log-action.dto';
import { DtoValidationErrors } from '../../error-handler/errors/dto-validation.errors';
import { ClientLogsService } from './client-logs.service';

describe('ClientLogsService', () => {
  let service: ClientLogsService;

  beforeEach(() => {
    service = new ClientLogsService();
  });

  describe('processWebLog', () => {
    it('does not throw', () => {
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
  });

  describe('processMobileLog', () => {
    it('does not throw', () => {
      expect(() =>
        service.processMobileLog({
          payload: { data: 'test' },
          platform: 'ios',
          timestamp: '2026-05-18T00:00:00.000Z',
          traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
        }),
      ).not.toThrow();
    });
  });

  describe('processBatchLogs', () => {
    const validWebLog: Record<string, unknown> = {
      actions: [{ ctx: 'app', level: WebLogLevel.INFO, message: 'test', payload: {} }],
      env: 'test',
      metadata: {
        browser: 'Chrome',
        browserVersion: '1',
        devicePixelRatio: 2,
        fullUrl: 'http://localhost',
        language: 'en',
        mobile: false,
        os: 'macOS',
        screen: '1x1',
        timezone: 'UTC',
        url: '/',
        viewport: '1x1',
      },
      timestamp: '2026-05-18T00:00:00.000Z',
      traceId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    };

    const validMobileLog: Record<string, unknown> = {
      payload: { data: 'test' },
      platform: 'ios',
      timestamp: '2026-05-18T00:00:00.000Z',
      traceId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    };

    describe('batch boundary validation', () => {
      it('throws DtoValidationErrors when batch is empty', () => {
        expect(() => service.processBatchLogs({})).toThrow(DtoValidationErrors);

        try {
          service.processBatchLogs({});
        } catch (error) {
          const err = error as DtoValidationErrors;
          expect(err.details).toEqual({ batch: ['Batch must contain at least 1 log entry'] });
        }
      });

      it('throws DtoValidationErrors when both arrays are empty', () => {
        expect(() => service.processBatchLogs({ mobileLogs: [], webLogs: [] })).toThrow(DtoValidationErrors);
      });

      it('throws DtoValidationErrors when total exceeds MAX_BATCH_SIZE', () => {
        const oversizedDto = {
          webLogs: Array.from({ length: MAX_BATCH_SIZE + 1 }, () => validWebLog),
        };

        expect(() => service.processBatchLogs(oversizedDto)).toThrow(DtoValidationErrors);

        try {
          service.processBatchLogs(oversizedDto);
        } catch (error) {
          const err = error as DtoValidationErrors;
          expect(err.details).toEqual({ batch: [`Batch total size must not exceed ${MAX_BATCH_SIZE}`] });
        }
      });

      it('throws DtoValidationErrors when combined arrays exceed MAX_BATCH_SIZE', () => {
        const oversizedDto = {
          mobileLogs: Array.from({ length: 60 }, () => validMobileLog),
          webLogs: Array.from({ length: 50 }, () => validWebLog),
        };

        expect(() => service.processBatchLogs(oversizedDto)).toThrow(DtoValidationErrors);
      });

      it('accepts batch exactly at MAX_BATCH_SIZE', () => {
        const dto = {
          webLogs: Array.from({ length: MAX_BATCH_SIZE }, () => validWebLog),
        };

        const result = service.processBatchLogs(dto);

        expect(result.total).toBe(MAX_BATCH_SIZE);
        expect(result.accepted).toBe(MAX_BATCH_SIZE);
        expect(result.failed).toBe(0);
      });
    });

    describe('per-item processing', () => {
      it('returns all accepted when all items are valid', () => {
        const result = service.processBatchLogs({
          mobileLogs: [validMobileLog],
          webLogs: [validWebLog],
        });

        expect(result.total).toBe(2);
        expect(result.accepted).toBe(2);
        expect(result.failed).toBe(0);
        expect(result.results[0]).toEqual({
          index: 0,
          status: BatchLogItemStatus.ACCEPTED,
          traceId: validWebLog.traceId,
          type: BatchLogType.WEB,
        });
        expect(result.results[1]).toEqual({
          index: 0,
          status: BatchLogItemStatus.ACCEPTED,
          traceId: validMobileLog.traceId,
          type: BatchLogType.MOBILE,
        });
      });

      it('marks invalid web log as failed without affecting valid mobile log', () => {
        const invalidWebLog: Record<string, unknown> = {
          env: 'test',
        };

        const result = service.processBatchLogs({
          mobileLogs: [validMobileLog],
          webLogs: [invalidWebLog],
        });

        expect(result.total).toBe(2);
        expect(result.accepted).toBe(1);
        expect(result.failed).toBe(1);

        const failedItem = result.results.find((r) => r.status === BatchLogItemStatus.FAILED);
        expect(failedItem!.type).toBe(BatchLogType.WEB);
        expect(failedItem!.index).toBe(0);
        expect(failedItem!.error).toBeTruthy();
        expect(failedItem!.traceId).toBeUndefined();

        const acceptedItem = result.results.find((r) => r.status === BatchLogItemStatus.ACCEPTED);
        expect(acceptedItem).toEqual({
          index: 0,
          status: BatchLogItemStatus.ACCEPTED,
          traceId: validMobileLog.traceId,
          type: BatchLogType.MOBILE,
        });
      });

      it('marks invalid mobile log as failed without affecting valid web log', () => {
        const invalidMobileLog: Record<string, unknown> = {
          platform: 123,
        };

        const result = service.processBatchLogs({
          mobileLogs: [invalidMobileLog],
          webLogs: [validWebLog],
        });

        expect(result.accepted).toBe(1);
        expect(result.failed).toBe(1);

        const failedItem = result.results.find((r) => r.status === BatchLogItemStatus.FAILED);
        expect(failedItem!.type).toBe(BatchLogType.MOBILE);
        expect(failedItem!.error).toBeTruthy();

        const acceptedItem = result.results.find((r) => r.status === BatchLogItemStatus.ACCEPTED);
        expect(acceptedItem!.type).toBe(BatchLogType.WEB);
      });

      it('marks multiple invalid items while processing valid ones', () => {
        const invalidWebLog: Record<string, unknown> = { env: 'test' };
        const invalidMobileLog: Record<string, unknown> = { platform: 123 };

        const result = service.processBatchLogs({
          mobileLogs: [validMobileLog, invalidMobileLog],
          webLogs: [invalidWebLog, validWebLog],
        });

        expect(result.total).toBe(4);
        expect(result.accepted).toBe(2);
        expect(result.failed).toBe(2);

        const failedResults = result.results.filter((r) => r.status === BatchLogItemStatus.FAILED);
        expect(failedResults).toHaveLength(2);
        expect(failedResults[0].type).toBe(BatchLogType.WEB);
        expect(failedResults[0].index).toBe(0);
        expect(failedResults[1].type).toBe(BatchLogType.MOBILE);
        expect(failedResults[1].index).toBe(1);
      });

      it('isolates processing errors from validation errors', () => {
        jest.spyOn(service, 'processWebLog').mockImplementationOnce(() => {
          throw new Error('s3 upload failed');
        });

        const result = service.processBatchLogs({
          mobileLogs: [validMobileLog],
          webLogs: [validWebLog],
        });

        expect(result.total).toBe(2);
        expect(result.accepted).toBe(1);
        expect(result.failed).toBe(1);

        const failedItem = result.results.find((r) => r.status === BatchLogItemStatus.FAILED);
        expect(failedItem!.error).toBe('s3 upload failed');
        expect(failedItem!.traceId).toBe(validWebLog.traceId);
      });

      it('handles non-Error thrown values from handler', () => {
        jest.spyOn(service, 'processMobileLog').mockImplementationOnce(() => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw 'string error';
        });

        const result = service.processBatchLogs({ mobileLogs: [validMobileLog] });

        expect(result.failed).toBe(1);
        expect(result.results[0].error).toBe('string error');
      });

      it('extracts traceId from raw item when available', () => {
        const invalidLogWithTraceId: Record<string, unknown> = {
          platform: 123,
          traceId: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
        };

        const result = service.processBatchLogs({ mobileLogs: [invalidLogWithTraceId] });

        const failedItem = result.results[0];
        expect(failedItem.traceId).toBe('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f');
        expect(failedItem.status).toBe(BatchLogItemStatus.FAILED);
      });

      it('returns consistent total/accepted/failed/results counts', () => {
        const result = service.processBatchLogs({
          mobileLogs: [validMobileLog],
          webLogs: [validWebLog],
        });

        expect(result.total).toBe(result.results.length);
        expect(result.accepted + result.failed).toBe(result.total);
      });
    });
  });
});
