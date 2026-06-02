import { Injectable } from '@nestjs/common';
import { HealthCheckResult, HealthCheckService, HealthIndicatorResult, PrismaHealthIndicator } from '@nestjs/terminus';

import { MetricsService } from '../metrics/metrics.service';
import { HealthDependency } from '../metrics/metrics/business.metrics';
import { PrismaService } from '../prisma/prisma.service';
import { RedisHealthService } from '../redis-manager/redis-health.service';
import { ShutdownHealthService } from '../shutdown/shutdown-health.service';

@Injectable()
export class HealthChecks {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: PrismaHealthIndicator,
    private readonly prismaService: PrismaService,
    private readonly redisHealth: RedisHealthService,
    private readonly shutdownHealthService: ShutdownHealthService,
    private readonly metricsService: MetricsService,
  ) {}

  async runAll(): Promise<HealthCheckResult> {
    const result = await this.health.check([
      (): Promise<HealthIndicatorResult<'database'>> => this.db.pingCheck('database', this.prismaService),
      (): Promise<HealthIndicatorResult<'redis'>> => this.redisHealth.pingCheck('redis'),
    ]);

    this.recordDependencyStatuses(result);

    return result;
  }

  async runCritical(): Promise<HealthCheckResult> {
    const result = await this.health.check([
      (): Promise<HealthIndicatorResult<'database'>> => this.db.pingCheck('database', this.prismaService),
      (): HealthIndicatorResult<'shutdown'> => this.shutdownHealthService.check('shutdown'),
    ]);

    this.recordDependencyStatuses(result);

    return result;
  }

  private mapToHealthDependency(key: string): HealthDependency | null {
    switch (key) {
      case 'database':
        return HealthDependency.DATABASE;
      case 'redis':
        return HealthDependency.REDIS;
      case 'shutdown':
        return HealthDependency.SHUTDOWN;
      default:
        return null;
    }
  }

  private recordDependencyStatuses(result: HealthCheckResult): void {
    for (const [key, value] of Object.entries(result.details)) {
      const dependency = this.mapToHealthDependency(key);
      if (dependency) {
        this.metricsService.recordHealthDependency(dependency, value.status === 'up');
      }
    }
  }
}
