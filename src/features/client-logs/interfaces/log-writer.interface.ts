import type { LogSource } from '../enums/log-source.enum';

export interface LogEntry {
  data: Record<string, unknown>;
  source: LogSource;
  timestamp: string;
  traceId: string;
}

export interface LogWriter {
  write(entry: LogEntry): Promise<void>;
}
