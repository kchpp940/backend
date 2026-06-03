import { Module } from '@nestjs/common';

import { MetricsController } from '../../api/metrics/metrics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MetricsService } from './metrics.service';
import { DatabaseMetrics } from './metrics/database.metrics';
import { TelemetryMetricsReporter } from './reporters/telemetry-metrics.reporter';

@Module({
  controllers: [MetricsController],
  exports: [MetricsService],
  imports: [PrismaModule],
  providers: [MetricsService, DatabaseMetrics, TelemetryMetricsReporter],
})
export class MetricsModule {}
