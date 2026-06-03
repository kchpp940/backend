import { LogSource } from '../enums/log-source.enum';
import { PinoLogWriter } from './pino-log.writer';

describe('PinoLogWriter', () => {
  let writer: PinoLogWriter;
  let logger: { log: jest.Mock };

  beforeEach(() => {
    logger = { log: jest.fn() };
    writer = new PinoLogWriter(logger as never);
  });

  describe('positive cases', () => {
    it('logs entry via LoggerService with structured context', async () => {
      const entry = {
        data: { level: 'info', message: 'test' },
        source: LogSource.WEB,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: 'trace-1',
      };

      await writer.write(entry);

      expect(logger.log).toHaveBeenCalledWith({
        ctx: 'client-logs:web',
        details: { ...entry.data, traceId: entry.traceId },
        msg: 'Client log entry ingested',
      });
    });

    it('uses mobile source in context for mobile entries', async () => {
      const entry = {
        data: { payload: { key: 'val' }, platform: 'ios' },
        source: LogSource.MOBILE,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: 'trace-2',
      };

      await writer.write(entry);

      expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({ ctx: 'client-logs:mobile' }));
    });
  });
});
