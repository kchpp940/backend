import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, register } from 'prom-client';

import { DatabaseMetrics } from './metrics/database.metrics';

@Injectable()
export class MetricsService implements OnModuleInit {
  private slowQueryGauge: Gauge<string>;

  constructor(
    private readonly databaseMetrics: DatabaseMetrics,
    @InjectMetric('client_logs_accepted_total')
    private readonly clientLogsAcceptedCounter: Counter<string>,
    @InjectMetric('client_logs_failed_total')
    private readonly clientLogsFailedCounter: Counter<string>,
    @InjectMetric('client_logs_batch_size')
    private readonly clientLogsBatchSizeGauge: Gauge<string>,
  ) {}

  async getDatabaseMetrics(): Promise<string> {
    await this.updateDatabaseMetrics();

    return register.getSingleMetricAsString('db_slow_query_ms');
  }

  onModuleInit(): void {
    this.slowQueryGauge = new Gauge({
      help: 'Mean execution time of slow queries',
      labelNames: ['query'],
      name: 'db_slow_query_ms',
    });
  }

  recordClientLogsAccepted(source: string, count: number): void {
    this.clientLogsAcceptedCounter.inc({ source }, count);
  }

  recordClientLogsBatchSize(source: string, size: number): void {
    this.clientLogsBatchSizeGauge.set({ source }, size);
  }

  recordClientLogsFailed(source: string, count: number): void {
    this.clientLogsFailedCounter.inc({ source }, count);
  }

  async updateDatabaseMetrics(): Promise<void> {
    const queries = await this.databaseMetrics.getTopSlowQueries(10);

    queries.forEach((q) => {
      this.slowQueryGauge.set({ query: q.query }, q.meanMs);
    });
  }
}
