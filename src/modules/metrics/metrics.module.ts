import { Module } from '@nestjs/common';

import { MetricsController } from '../../api/metrics/metrics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MetricsService } from './metrics.service';
import {
  ClientLogsAcceptedMetric,
  ClientLogsBatchSizeMetric,
  ClientLogsFailedMetric,
} from './metrics/client-logs.metrics';
import { DatabaseMetrics } from './metrics/database.metrics';

@Module({
  controllers: [MetricsController],
  exports: [MetricsService],
  imports: [PrismaModule],
  providers: [
    MetricsService,
    DatabaseMetrics,
    ClientLogsAcceptedMetric,
    ClientLogsFailedMetric,
    ClientLogsBatchSizeMetric,
  ],
})
export class MetricsModule {}
