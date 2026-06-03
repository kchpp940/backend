import { Injectable } from '@nestjs/common';

import type { LogEntry, LogWriter } from '../interfaces/log-writer.interface';

import { LoggerService } from '../../../logger/logger.service';

@Injectable()
export class PinoLogWriter implements LogWriter {
  constructor(private readonly logger: LoggerService) {}

  write(entry: LogEntry): Promise<void> {
    this.logger.log({
      ctx: `client-logs:${entry.source}`,
      details: { ...entry.data, traceId: entry.traceId },
      msg: 'Client log entry ingested',
    });

    return Promise.resolve();
  }
}
