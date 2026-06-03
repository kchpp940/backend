import type { LogSource } from '../enums/log-source.enum';

export interface IngestibleLog {
  entries: Record<string, unknown>[];
  source: LogSource;
  timestamp: string;
  traceId: string;
}
