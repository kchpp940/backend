import type { TransformFnParams } from 'class-transformer';

export class EnvParseError extends Error {
  constructor(
    public readonly key: string,
    public readonly rawValue: string,
    public readonly expectedFormat: string,
    message: string,
  ) {
    super(message);
    this.name = 'EnvParseError';
  }

  formatMessage(): string {
    return [
      `❌ Environment variable parse error for: ${this.key}`,
      `   Raw value: ${JSON.stringify(this.rawValue)}`,
      `   Expected format: ${this.expectedFormat}`,
      `   Details: ${this.message}`,
    ].join('\n');
  }
}

export class EnvParseContext {
  private errors: EnvParseError[] = [];

  clear(): void {
    this.errors = [];
  }

  collect(error: EnvParseError): void {
    this.errors.push(error);
  }

  getErrors(): EnvParseError[] {
    return [...this.errors];
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }
}

const contextStack: EnvParseContext[] = [];

export function formatEnvParseErrors(errors: unknown[]): string {
  const messages = errors.map((err) => {
    if (err instanceof EnvParseError) {
      return err.formatMessage();
    }

    return String(err);
  });

  return messages.join('\n\n');
}

export function getCurrentEnvParseContext(): EnvParseContext | undefined {
  return contextStack[contextStack.length - 1];
}

export function parseEnvArray(params: TransformFnParams): unknown[] {
  const key = String(params.key);
  const value = params.value as unknown;

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return [];
  }

  if (value.trim() === '') {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      const error = new EnvParseError(
        key,
        value,
        'JSON array (e.g., ["item1", "item2"])',
        `Parsed value is not an array, got ${typeof parsed}`,
      );
      collectError(error);

      return [];
    }

    return parsed;
  } catch (error) {
    const parseError = new EnvParseError(
      key,
      value,
      'JSON array (e.g., ["item1", "item2"])',
      error instanceof Error ? error.message : 'Unknown parse error',
    );
    collectError(parseError);

    return [];
  }
}

export function parseEnvBoolean(params: TransformFnParams): boolean {
  const key = String(params.key);
  const value = params.value as unknown;

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return false;
    }
    const error = new EnvParseError(key, value, 'boolean (true or false)', `Invalid boolean string: "${value}"`);
    collectError(error);

    return false;
  }

  const error = new EnvParseError(key, String(value), 'boolean (true or false)', `Invalid value type: ${typeof value}`);
  collectError(error);

  return false;
}

export function parseEnvStringArray(params: TransformFnParams): string[] {
  return parseEnvTypedArray<string>(params, (item): item is string => typeof item === 'string', {
    formatExample: '["item1", "item2"]',
    itemType: 'string',
  });
}

export function parseEnvTypedArray<T>(
  params: TransformFnParams,
  validator: (item: unknown) => item is T,
  options: {
    formatExample: string;
    itemType: string;
  },
): T[] {
  const parsed = parseEnvArray(params);

  return parsed
    .map((item, index) => {
      if (!validator(item)) {
        const error = new EnvParseError(
          params.key,
          JSON.stringify(parsed),
          `JSON array of ${options.itemType} (e.g., ${options.formatExample})`,
          `Item at index ${index} is not a ${options.itemType}, got ${typeof item}`,
        );
        collectError(error);

        return null;
      }

      return item;
    })
    .filter((item): item is T => item !== null);
}

export function popEnvParseContext(): EnvParseContext | undefined {
  return contextStack.pop();
}

export function pushEnvParseContext(): EnvParseContext {
  const context = new EnvParseContext();
  contextStack.push(context);

  return context;
}

function collectError(error: EnvParseError): void {
  const context = getCurrentEnvParseContext();
  if (context) {
    context.collect(error);
  }
}
