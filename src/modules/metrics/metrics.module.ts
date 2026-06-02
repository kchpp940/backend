import { Module } from '@nestjs/common';

import { MetricsController } from '../../api/metrics/metrics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MetricsService } from './metrics.service';
import { BusinessMetrics } from './metrics/business.metrics';
import { DatabaseMetrics } from './metrics/database.metrics';

@Module({
  controllers: [MetricsController],
  exports: [MetricsService],
  imports: [PrismaModule],
  providers: [MetricsService, DatabaseMetrics, BusinessMetrics],
})
export class MetricsModule {}
