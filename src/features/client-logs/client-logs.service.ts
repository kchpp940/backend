import { Injectable } from '@nestjs/common';

import { MobileLogBatchDto } from '../../api/client-logs/dtos/mobile-log-batch.dto';
import { MobileLogDto } from '../../api/client-logs/dtos/mobile-log.dto';
import { WebLogBatchDto } from '../../api/client-logs/dtos/web-log-batch.dto';
import { WebLogDto } from '../../api/client-logs/dtos/web-log.dto';
import { MetricsService } from '../../modules/metrics/metrics.service';
import { LogSource } from '../../modules/metrics/metrics/business.metrics';

export interface BatchResult {
  accepted: number;
  failed: number;
}

@Injectable()
export class ClientLogsService {
  constructor(private readonly metricsService: MetricsService) {}

  processMobileLog(_dto: MobileLogDto): void {
    const result = this.processMobileLogBatch({ logs: [_dto] });
    // Single log endpoint returns void, batch result is only for metrics
    void result;
  }

  processMobileLogBatch(dto: MobileLogBatchDto): BatchResult {
    const result = this.validateAndProcessBatch(dto.logs);
    this.metricsService.recordClientLogBatch(LogSource.MOBILE, result.accepted, result.failed);

    return result;
  }

  processWebLog(_dto: WebLogDto): void {
    const result = this.processWebLogBatch({ logs: [_dto] });
    // Single log endpoint returns void, batch result is only for metrics
    void result;
  }

  processWebLogBatch(dto: WebLogBatchDto): BatchResult {
    const result = this.validateAndProcessBatch(dto.logs);
    this.metricsService.recordClientLogBatch(LogSource.WEB, result.accepted, result.failed);

    return result;
  }

  private validateAndProcessBatch<T>(_logs: T[]): BatchResult {
    // Simulated processing - all logs accepted
    return { accepted: _logs.length, failed: 0 };
  }
}
