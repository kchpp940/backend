import { LogSource } from './enums/log-source.enum';
import { LogIngestionPipeline } from './log-ingestion-pipeline';

describe('LogIngestionPipeline', () => {
  let pipeline: LogIngestionPipeline;
  let writer: { write: jest.Mock };
  let logger: { error: jest.Mock };

  beforeEach(() => {
    writer = { write: jest.fn().mockResolvedValue(undefined) };
    logger = { error: jest.fn() };

    pipeline = new LogIngestionPipeline(writer, logger as never);
  });

  describe('positive cases', () => {
    it('processes a single-entry log and returns accepted=1 failed=0 with results', async () => {
      const result = await pipeline.process({
        entries: [{ data: 'test' }],
        source: LogSource.WEB,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
      });

      expect(result.accepted).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.source).toBe(LogSource.WEB);
      expect(result.total).toBe(1);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].status).toBe('accepted');
      expect(result.results[0].entry).toEqual({ data: 'test' });
    });

    it('processes a multi-entry log and counts accepted correctly', async () => {
      const result = await pipeline.process({
        entries: [{ a: 1 }, { b: 2 }, { c: 3 }],
        source: LogSource.MOBILE,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
      });

      expect(result.accepted).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.source).toBe(LogSource.MOBILE);
      expect(result.total).toBe(3);
      expect(result.results).toHaveLength(3);
    });

    it('delegates each entry to writer.write', async () => {
      await pipeline.process({
        entries: [{ a: 1 }, { b: 2 }],
        source: LogSource.WEB,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: 'trace-1',
      });

      expect(writer.write).toHaveBeenCalledTimes(2);
      expect(writer.write).toHaveBeenCalledWith({
        data: { a: 1 },
        source: LogSource.WEB,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: 'trace-1',
      });
    });
  });

  describe('negative cases', () => {
    it('counts failed entries and logs error when writer throws', async () => {
      writer.write.mockRejectedValueOnce(new Error('S3 error')).mockResolvedValueOnce(undefined);

      const result = await pipeline.process({
        entries: [{ a: 1 }, { b: 2 }],
        source: LogSource.WEB,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: 'trace-1',
      });

      expect(result.accepted).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.total).toBe(2);
      expect(result.results[0].status).toBe('failed');
      expect(result.results[0].error).toBe('S3 error');
      expect(result.results[1].status).toBe('accepted');
      expect(logger.error).toHaveBeenCalledWith({
        ctx: 'client-logs:web',
        details: { entry: { a: 1 }, error: 'S3 error', traceId: 'trace-1' },
        msg: 'Failed to ingest log entry',
      });
    });

    it('returns all failed when every entry throws', async () => {
      writer.write.mockRejectedValue(new Error('S3 error'));

      const result = await pipeline.process({
        entries: [{ a: 1 }],
        source: LogSource.MOBILE,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: 'trace-2',
      });

      expect(result.accepted).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.total).toBe(1);
      expect(result.results[0].status).toBe('failed');
      expect(result.results[0].error).toBe('S3 error');
      expect(logger.error).toHaveBeenCalledWith({
        ctx: 'client-logs:mobile',
        details: { entry: { a: 1 }, error: 'S3 error', traceId: 'trace-2' },
        msg: 'Failed to ingest log entry',
      });
    });

    it('handles non-Error rejections gracefully', async () => {
      writer.write.mockRejectedValueOnce('string error');

      const result = await pipeline.process({
        entries: [{ a: 1 }],
        source: LogSource.WEB,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: 'trace-3',
      });

      expect(result.failed).toBe(1);

      const loggedDetails = (logger.error.mock.calls[0] as [Record<string, unknown>])[0].details as Record<
        string,
        unknown
      >;
      expect(loggedDetails.error).toBe('string error');
    });
  });
});
