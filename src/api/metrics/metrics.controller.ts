import { Controller, Get, Header } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { METRICS_ENDPOINT } from '../../constants/url.contants';
import { MetricsService } from '../../modules/metrics/metrics.service';

@Controller(METRICS_ENDPOINT)
@Public()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4')
  getAllMetrics(): Promise<string> {
    return this.metricsService.getAllMetrics();
  }

  @Get('database')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  getDatabaseMetrics(): Promise<string> {
    return this.metricsService.getDatabaseMetrics();
  }
}
