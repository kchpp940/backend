import { WebLogLevel } from '../../../api/client-logs/dtos/web-log-action.dto';
import { LogSource } from '../enums/log-source.enum';
import { WebLogNormalizer } from './web-log.normalizer';

describe('WebLogNormalizer', () => {
  let normalizer: WebLogNormalizer;

  beforeEach(() => {
    normalizer = new WebLogNormalizer();
  });

  describe('positive cases', () => {
    const metadata = {
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
    };

    it('normalizes a web log DTO into an IngestibleLog with multiple entries', () => {
      const dto = {
        actions: [
          { ctx: 'app', level: WebLogLevel.INFO, message: 'test', payload: {} },
          { ctx: 'api', level: WebLogLevel.ERROR, message: 'fail', payload: { code: 500 } },
        ],
        env: 'production',
        metadata,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
      };

      const result = normalizer.normalize(dto);

      expect(result.source).toBe(LogSource.WEB);
      expect(result.timestamp).toBe(dto.timestamp);
      expect(result.traceId).toBe(dto.traceId);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({
        ctx: 'app',
        env: 'production',
        level: WebLogLevel.INFO,
        message: 'test',
        metadata,
        payload: {},
      });
      expect(result.entries[1]).toEqual({
        ctx: 'api',
        env: 'production',
        level: WebLogLevel.ERROR,
        message: 'fail',
        metadata,
        payload: { code: 500 },
      });
    });

    it('normalizes a web log DTO with a single action', () => {
      const dto = {
        actions: [{ ctx: 'app', level: WebLogLevel.DEBUG, message: 'hello', payload: {} }],
        env: 'test',
        metadata,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
      };

      const result = normalizer.normalize(dto);

      expect(result.entries).toHaveLength(1);
    });

    it('exposes source as LogSource.WEB', () => {
      expect(normalizer.source).toBe(LogSource.WEB);
    });
  });
});
