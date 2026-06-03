import { LogSource } from '../enums/log-source.enum';
import { MobileLogNormalizer } from './mobile-log.normalizer';

describe('MobileLogNormalizer', () => {
  let normalizer: MobileLogNormalizer;

  beforeEach(() => {
    normalizer = new MobileLogNormalizer();
  });

  describe('positive cases', () => {
    it('normalizes a mobile log DTO into an IngestibleLog', () => {
      const dto = {
        payload: { data: 'test' },
        platform: 'ios',
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
      };

      const result = normalizer.normalize(dto);

      expect(result.source).toBe(LogSource.MOBILE);
      expect(result.timestamp).toBe(dto.timestamp);
      expect(result.traceId).toBe(dto.traceId);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({ payload: dto.payload, platform: dto.platform });
    });

    it('exposes source as LogSource.MOBILE', () => {
      expect(normalizer.source).toBe(LogSource.MOBILE);
    });
  });
});
