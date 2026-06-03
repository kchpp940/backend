import { frontendMapper } from './frontend.mapper';

describe('frontendMapper', () => {
  describe('negative cases', () => {
    it('returns details as-is when it is not an object', () => {
      expect(frontendMapper('plain string')).toBe('plain string');
      expect(frontendMapper(42)).toBe(42);
      expect(frontendMapper(null)).toBeNull();
    });

    it('returns details as-is when driverAdapterError is absent', () => {
      const details = { someOtherField: 'value' };

      expect(frontendMapper(details)).toBe(details);
    });

    it('returns details as-is when driverAdapterError is not an object', () => {
      const details = { driverAdapterError: 'not an object' };

      expect(frontendMapper(details)).toBe(details);
    });

    it('returns details as-is when cause is absent from driverAdapterError', () => {
      const details = { driverAdapterError: { someField: 'x' } };

      expect(frontendMapper(details)).toBe(details);
    });

    it('returns details as-is when cause is not an object', () => {
      const details = { driverAdapterError: { cause: 'not an object' } };

      expect(frontendMapper(details)).toBe(details);
    });

    it('returns details as-is when cause.message is not a string', () => {
      const details = { driverAdapterError: { cause: { message: 123 } } };

      expect(frontendMapper(details)).toBe(details);
    });

    it('returns details as-is when cause.message is absent', () => {
      const details = { driverAdapterError: { cause: { otherProp: true } } };

      expect(frontendMapper(details)).toBe(details);
    });
  });

  describe('positive cases', () => {
    it('extracts message string from nested driverAdapterError', () => {
      const details = {
        driverAdapterError: {
          cause: {
            message: 'Connection refused',
          },
        },
      };

      expect(frontendMapper(details)).toBe('Connection refused');
    });

    it('extracts message even when other fields exist in the structure', () => {
      const details = {
        driverAdapterError: {
          cause: {
            code: 'ETIMEDOUT',
            message: 'Timeout',
          },
          someField: 'x',
        },
      };

      expect(frontendMapper(details)).toBe('Timeout');
    });
  });
});
