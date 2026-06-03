import { Inject, Injectable } from '@nestjs/common';

import type { IngestibleLog } from './interfaces/ingestible-log.interface';
import type { LogWriter } from './interfaces/log-writer.interface';

import { LoggerService } from '../../logger/logger.service';
import { LOG_WRITER } from './di/di.types';
import { LogSource } from './enums/log-source.enum';

export interface IngestionEntryResult {
  entry: Record<string, unknown>;
  error?: string;
  status: 'accepted' | 'failed';
}

export interface IngestionResult {
  accepted: number;
  failed: number;
  results: IngestionEntryResult[];
  source: LogSource;
  total: number;
}

@Injectable()
export class LogIngestionPipeline {
  constructor(
    @Inject(LOG_WRITER) private readonly writer: LogWriter,
    private readonly logger: LoggerService,
  ) {}

  async process(log: IngestibleLog): Promise<IngestionResult> {
    const { entries, source, timestamp, traceId } = log;

    const results: IngestionEntryResult[] = [];
    let accepted = 0;
    let failed = 0;

    for (const entry of entries) {
      try {
        await this.writer.write({ data: entry, source, timestamp, traceId });

        results.push({ entry, status: 'accepted' });

        accepted++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        this.logger.error({
          ctx: `client-logs:${source}`,
          details: { entry, error: errorMessage, traceId },
          msg: 'Failed to ingest log entry',
        });

        results.push({ entry, error: errorMessage, status: 'failed' });

        failed++;
      }
    }

    return { accepted, failed, results, source, total: entries.length };
  }
}
