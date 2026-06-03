import { Module } from '@nestjs/common';

import { ClientLogsController } from '../../api/client-logs/client-logs.controller';
import { LoggerModule } from '../../logger/logger.module';
import { MetricsModule } from '../../modules/metrics/metrics.module';
import { ClientLogsService } from './client-logs.service';
import { LOG_WRITER } from './di/di.types';
import { LogIngestionPipeline } from './log-ingestion-pipeline';
import { MobileLogNormalizer } from './normalizers/mobile-log.normalizer';
import { WebLogNormalizer } from './normalizers/web-log.normalizer';
import { PinoLogWriter } from './writers/pino-log.writer';

@Module({
  controllers: [ClientLogsController],
  imports: [LoggerModule, MetricsModule],
  providers: [
    ClientLogsService,
    LogIngestionPipeline,
    WebLogNormalizer,
    MobileLogNormalizer,
    PinoLogWriter,
    { provide: LOG_WRITER, useExisting: PinoLogWriter },
  ],
})
export class ClientLogsModule {}
