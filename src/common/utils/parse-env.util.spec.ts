import 'reflect-metadata';
import type { TransformFnParams } from 'class-transformer';

import {
  EnvParseContext,
  EnvParseError,
  formatEnvParseErrors,
  getCurrentEnvParseContext,
  parseEnvArray,
  parseEnvBoolean,
  parseEnvStringArray,
  parseEnvTypedArray,
  popEnvParseContext,
  pushEnvParseContext,
} from './parse-env.util';

function createParams(key: string, value: unknown): TransformFnParams {
  return {
    key,
    obj: {},
    options: {},
    type: 0,
    value,
  };
}

describe('parse-env.util', () => {
  afterEach(() => {
    while (getCurrentEnvParseContext()) {
      popEnvParseContext();
    }
  });

  describe('EnvParseError', () => {
    it('formats error message correctly', () => {
      const error = new EnvParseError('TEST_VAR', 'invalid', 'JSON array', 'Unexpected token');

      expect(error.formatMessage()).toContain('TEST_VAR');
      expect(error.formatMessage()).toContain('invalid');
      expect(error.formatMessage()).toContain('JSON array');
      expect(error.formatMessage()).toContain('Unexpected token');
    });
  });

  describe('EnvParseContext', () => {
    it('collects and returns errors', () => {
      const context = new EnvParseContext();
      expect(context.hasErrors()).toBe(false);
      expect(context.getErrors()).toHaveLength(0);

      context.collect(new EnvParseError('VAR1', 'bad1', 'fmt1', 'err1'));
      expect(context.hasErrors()).toBe(true);
      expect(context.getErrors()).toHaveLength(1);

      context.collect(new EnvParseError('VAR2', 'bad2', 'fmt2', 'err2'));
      expect(context.getErrors()).toHaveLength(2);

      context.clear();
      expect(context.hasErrors()).toBe(false);
      expect(context.getErrors()).toHaveLength(0);
    });

    it('returns a copy of errors', () => {
      const context = new EnvParseContext();
      context.collect(new EnvParseError('VAR1', 'bad1', 'fmt1', 'err1'));

      const errors1 = context.getErrors();
      const errors2 = context.getErrors();
      expect(errors1).not.toBe(errors2);
      expect(errors1).toEqual(errors2);
    });
  });

  describe('context stack', () => {
    it('push and pop context', () => {
      expect(getCurrentEnvParseContext()).toBeUndefined();

      const context1 = pushEnvParseContext();
      expect(getCurrentEnvParseContext()).toBe(context1);

      const context2 = pushEnvParseContext();
      expect(getCurrentEnvParseContext()).toBe(context2);

      const popped2 = popEnvParseContext();
      expect(popped2).toBe(context2);
      expect(getCurrentEnvParseContext()).toBe(context1);

      const popped1 = popEnvParseContext();
      expect(popped1).toBe(context1);
      expect(getCurrentEnvParseContext()).toBeUndefined();
    });

    it('isolates errors between contexts', () => {
      const context1 = pushEnvParseContext();
      parseEnvArray(createParams('VAR1', '[invalid1'));
      expect(context1.getErrors()).toHaveLength(1);
      expect(context1.getErrors()[0].key).toBe('VAR1');

      const context2 = pushEnvParseContext();
      parseEnvArray(createParams('VAR2', '[invalid2'));
      expect(context2.getErrors()).toHaveLength(1);
      expect(context2.getErrors()[0].key).toBe('VAR2');
      expect(context1.getErrors()).toHaveLength(1);

      popEnvParseContext();
      expect(getCurrentEnvParseContext()).toBe(context1);

      popEnvParseContext();
      expect(getCurrentEnvParseContext()).toBeUndefined();
    });
  });

  describe('parseEnvArray', () => {
    beforeEach(() => {
      pushEnvParseContext();
    });

    it('returns array as-is when value is already an array', () => {
      const params = createParams('TEST', ['a', 'b']);
      const result = parseEnvArray(params);

      expect(result).toEqual(['a', 'b']);
      expect(getCurrentEnvParseContext()!.getErrors()).toHaveLength(0);
    });

    it('returns empty array when value is not a string', () => {
      const params = createParams('TEST', 123);
      const result = parseEnvArray(params);

      expect(result).toEqual([]);
      expect(getCurrentEnvParseContext()!.getErrors()).toHaveLength(0);
    });

    it('returns empty array when value is empty string', () => {
      const params = createParams('TEST', '');
      const result = parseEnvArray(params);

      expect(result).toEqual([]);
      expect(getCurrentEnvParseContext()!.getErrors()).toHaveLength(0);
    });

    it('parses valid JSON array string', () => {
      const params = createParams('TEST', '["a", "b", "c"]');
      const result = parseEnvArray(params);

      expect(result).toEqual(['a', 'b', 'c']);
      expect(getCurrentEnvParseContext()!.getErrors()).toHaveLength(0);
    });

    it('collects error when JSON is invalid', () => {
      const params = createParams('TEST_VAR', '[invalid');
      const result = parseEnvArray(params);

      expect(result).toEqual([]);
      const errors = getCurrentEnvParseContext()!.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(EnvParseError);
      expect(errors[0].key).toBe('TEST_VAR');
      expect(errors[0].rawValue).toBe('[invalid');
      expect(errors[0].expectedFormat).toContain('JSON array');
    });

    it('collects error when parsed value is not an array', () => {
      const params = createParams('TEST_VAR', '"not-an-array"');
      const result = parseEnvArray(params);

      expect(result).toEqual([]);
      const errors = getCurrentEnvParseContext()!.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].key).toBe('TEST_VAR');
    });
  });

  describe('parseEnvBoolean', () => {
    beforeEach(() => {
      pushEnvParseContext();
    });

    it('returns boolean as-is when value is already boolean', () => {
      expect(parseEnvBoolean(createParams('TEST', true))).toBe(true);
      expect(parseEnvBoolean(createParams('TEST', false))).toBe(false);
      expect(getCurrentEnvParseContext()!.getErrors()).toHaveLength(0);
    });

    it('parses "true" as true', () => {
      expect(parseEnvBoolean(createParams('TEST', 'true'))).toBe(true);
      expect(parseEnvBoolean(createParams('TEST', 'TRUE'))).toBe(true);
      expect(parseEnvBoolean(createParams('TEST', 'True'))).toBe(true);
    });

    it('parses "1" as true', () => {
      expect(parseEnvBoolean(createParams('TEST', '1'))).toBe(true);
    });

    it('parses "yes" as true', () => {
      expect(parseEnvBoolean(createParams('TEST', 'yes'))).toBe(true);
      expect(parseEnvBoolean(createParams('TEST', 'YES'))).toBe(true);
    });

    it('parses "false" as false', () => {
      expect(parseEnvBoolean(createParams('TEST', 'false'))).toBe(false);
      expect(parseEnvBoolean(createParams('TEST', 'FALSE'))).toBe(false);
      expect(parseEnvBoolean(createParams('TEST', 'False'))).toBe(false);
    });

    it('parses "0" as false', () => {
      expect(parseEnvBoolean(createParams('TEST', '0'))).toBe(false);
    });

    it('parses "no" as false', () => {
      expect(parseEnvBoolean(createParams('TEST', 'no'))).toBe(false);
      expect(parseEnvBoolean(createParams('TEST', 'NO'))).toBe(false);
    });

    it('collects error for invalid boolean string', () => {
      const result = parseEnvBoolean(createParams('TEST_VAR', 'invalid'));

      expect(result).toBe(false);
      const errors = getCurrentEnvParseContext()!.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].key).toBe('TEST_VAR');
      expect(errors[0].rawValue).toBe('invalid');
      expect(errors[0].expectedFormat).toContain('boolean');
    });

    it('collects error for non-string non-boolean value', () => {
      const result = parseEnvBoolean(createParams('TEST_VAR', 123));

      expect(result).toBe(false);
      const errors = getCurrentEnvParseContext()!.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].key).toBe('TEST_VAR');
    });
  });

  describe('parseEnvStringArray', () => {
    beforeEach(() => {
      pushEnvParseContext();
    });

    it('parses valid string array', () => {
      const params = createParams('TEST', '["a", "b", "c"]');
      const result = parseEnvStringArray(params);

      expect(result).toEqual(['a', 'b', 'c']);
      expect(getCurrentEnvParseContext()!.getErrors()).toHaveLength(0);
    });

    it('collects error for non-string items', () => {
      const params = createParams('TEST_VAR', '[1, 2, "c"]');
      const result = parseEnvStringArray(params);

      expect(result).toEqual(['c']);
      const errors = getCurrentEnvParseContext()!.getErrors();
      expect(errors).toHaveLength(2);
      expect(errors[0].key).toBe('TEST_VAR');
      expect(errors[0].expectedFormat).toContain('JSON array of string');
    });
  });

  describe('parseEnvTypedArray', () => {
    beforeEach(() => {
      pushEnvParseContext();
    });

    it('filters items that do not pass validator', () => {
      const params = createParams('TEST_VAR', '[1, 2, 3, "four"]');
      const result = parseEnvTypedArray<number>(params, (item): item is number => typeof item === 'number', {
        formatExample: '[1, 2, 3]',
        itemType: 'number',
      });

      expect(result).toEqual([1, 2, 3]);
      const errors = getCurrentEnvParseContext()!.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].key).toBe('TEST_VAR');
      expect(errors[0].expectedFormat).toContain('JSON array of number');
    });
  });

  describe('error collection within context', () => {
    it('collects multiple errors from multiple calls', () => {
      pushEnvParseContext();
      parseEnvArray(createParams('VAR1', '[invalid1'));
      parseEnvArray(createParams('VAR2', '[invalid2'));

      const errors = getCurrentEnvParseContext()!.getErrors();
      expect(errors).toHaveLength(2);
      expect(errors[0].key).toBe('VAR1');
      expect(errors[1].key).toBe('VAR2');
    });
  });

  describe('formatEnvParseErrors', () => {
    it('formats EnvParseError instances', () => {
      const errors = [
        new EnvParseError('VAR1', 'bad1', 'format1', 'error1'),
        new EnvParseError('VAR2', 'bad2', 'format2', 'error2'),
      ];

      const result = formatEnvParseErrors(errors);
      expect(result).toContain('VAR1');
      expect(result).toContain('VAR2');
      expect(result).toContain('bad1');
      expect(result).toContain('bad2');
    });

    it('handles non-EnvParseError items', () => {
      const errors = [new Error('regular error'), 'string error'];

      const result = formatEnvParseErrors(errors);
      expect(result).toContain('regular error');
      expect(result).toContain('string error');
    });
  });
});
