import { Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import {
  BatchClientLogResultDto,
  BatchClientLogsResponseDto,
  BatchLogItemStatus,
  BatchLogType,
} from '../../api/client-logs/dtos/batch-client-log-result.dto';
import { BatchClientLogsDto, MAX_BATCH_SIZE } from '../../api/client-logs/dtos/batch-client-logs.dto';
import { MobileLogDto } from '../../api/client-logs/dtos/mobile-log.dto';
import { WebLogDto } from '../../api/client-logs/dtos/web-log.dto';
import { DtoValidationErrors } from '../../error-handler/errors/dto-validation.errors';

@Injectable()
export class ClientLogsService {
  private readonly logger = new Logger(ClientLogsService.name);

  processBatchLogs(dto: BatchClientLogsDto): BatchClientLogsResponseDto {
    const webLogs = dto.webLogs ?? [];
    const mobileLogs = dto.mobileLogs ?? [];
    const total = webLogs.length + mobileLogs.length;

    if (total === 0) {
      throw new DtoValidationErrors({ batch: ['Batch must contain at least 1 log entry'] });
    }

    if (total > MAX_BATCH_SIZE) {
      throw new DtoValidationErrors({ batch: [`Batch total size must not exceed ${MAX_BATCH_SIZE}`] });
    }

    const results: BatchClientLogResultDto[] = [];

    for (const [index, raw] of webLogs.entries()) {
      results.push(
        this.validateAndProcess(raw, WebLogDto, BatchLogType.WEB, index, (valid) => this.processWebLog(valid)),
      );
    }

    for (const [index, raw] of mobileLogs.entries()) {
      results.push(
        this.validateAndProcess(raw, MobileLogDto, BatchLogType.MOBILE, index, (valid) => this.processMobileLog(valid)),
      );
    }

    const accepted = results.filter((r) => r.status === BatchLogItemStatus.ACCEPTED).length;
    const failed = results.filter((r) => r.status === BatchLogItemStatus.FAILED).length;

    return { accepted, failed, results, total: results.length };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  processMobileLog(_dto: MobileLogDto): void {
    /* TODO: upload to S3 */
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  processWebLog(_dto: WebLogDto): void {
    /* TODO: upload to S3 */
  }

  private validateAndProcess<T extends object>(
    raw: Record<string, unknown>,
    cls: new () => T,
    type: BatchLogType,
    index: number,
    handler: (dto: T) => void,
  ): BatchClientLogResultDto {
    const traceId = typeof raw.traceId === 'string' ? raw.traceId : undefined;

    try {
      const instance = plainToInstance(cls, raw);
      const errors = validateSync(instance as object);

      if (errors.length > 0) {
        const message = errors.map((e) => Object.values(e.constraints ?? {}).join('; ')).join('; ');

        throw new Error(message);
      }

      handler(instance);

      return { index, status: BatchLogItemStatus.ACCEPTED, traceId, type };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to process ${type} log at index ${index}${traceId ? ` (traceId: ${traceId})` : ''}: ${message}`,
      );

      return { error: message, index, status: BatchLogItemStatus.FAILED, traceId, type };
    }
  }
}
