import { Injectable } from '@nestjs/common';

import type { ClientLogsProcessingResult } from './interfaces/client-logs-processing-result.interface';
import type { IngestionResult } from './log-ingestion-pipeline';

import { MobileLogDto } from '../../api/client-logs/dtos/mobile-log.dto';
import { WebLogDto } from '../../api/client-logs/dtos/web-log.dto';
import { MetricsService } from '../../modules/metrics/metrics.service';
import { LogIngestionPipeline } from './log-ingestion-pipeline';
import { MobileLogNormalizer } from './normalizers/mobile-log.normalizer';
import { WebLogNormalizer } from './normalizers/web-log.normalizer';

@Injectable()
export class ClientLogsService {
  constructor(
    private readonly pipeline: LogIngestionPipeline,
    private readonly webNormalizer: WebLogNormalizer,
    private readonly mobileNormalizer: MobileLogNormalizer,
    private readonly metricsService: MetricsService,
  ) {}

  async processMobileLog(dto: MobileLogDto): Promise<ClientLogsProcessingResult> {
    const log = this.mobileNormalizer.normalize(dto);
    const result = await this.pipeline.process(log);

    this.recordMetrics(result);

    return this.toPublicResult(result);
  }

  async processWebLog(dto: WebLogDto): Promise<ClientLogsProcessingResult> {
    const log = this.webNormalizer.normalize(dto);
    const result = await this.pipeline.process(log);

    this.recordMetrics(result);

    return this.toPublicResult(result);
  }

  private recordMetrics(result: IngestionResult): void {
    this.metricsService.recordClientLogsBatchSize(result.source, result.total);
    this.metricsService.recordClientLogsAccepted(result.source, result.accepted);
    this.metricsService.recordClientLogsFailed(result.source, result.failed);
  }

  private toPublicResult(result: IngestionResult): ClientLogsProcessingResult {
    return {
      accepted: result.accepted,
      failed: result.failed,
      results: result.results,
    };
  }
}
