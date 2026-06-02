import { Injectable, OnModuleInit } from '@nestjs/common';
import { Gauge, register } from 'prom-client';

import {
  BusinessInterface,
  BusinessMetrics,
  BusinessOperation,
  BusinessStatus,
  HealthDependency,
  LogSource,
} from './metrics/business.metrics';
import { DatabaseMetrics } from './metrics/database.metrics';

@Injectable()
export class MetricsService implements OnModuleInit {
  private slowQueryGauge: Gauge<string>;

  constructor(
    private readonly databaseMetrics: DatabaseMetrics,
    private readonly businessMetrics: BusinessMetrics,
  ) {}

  async getAllMetrics(): Promise<string> {
    await this.updateDatabaseMetrics();

    return register.metrics();
  }

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

  recordBusinessRequest(
    interfaceType: BusinessInterface,
    operation: BusinessOperation,
    status: BusinessStatus,
    durationSeconds: number,
    errorCategory?: string,
    errorCode?: string,
  ): void {
    this.businessMetrics.recordRequest(interfaceType, operation, status, durationSeconds, errorCategory, errorCode);
  }

  recordClientLogBatch(source: LogSource, accepted: number, failed: number): void {
    this.businessMetrics.recordClientLogBatch(source, accepted, failed);
  }

  recordHealthDependency(dependency: HealthDependency, isUp: boolean): void {
    this.businessMetrics.recordHealthDependency(dependency, isUp);
  }

  async updateDatabaseMetrics(): Promise<void> {
    const queries = await this.databaseMetrics.getTopSlowQueries(10);

    queries.forEach((q) => {
      this.slowQueryGauge.set({ query: q.query }, q.meanMs);
    });
  }
}
