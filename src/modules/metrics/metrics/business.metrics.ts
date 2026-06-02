import { Counter, Gauge, Histogram } from 'prom-client';

export enum BusinessInterface {
  CLIENT_LOGS = 'client-logs',
  HEALTH = 'health',
  OTHER = 'other',
  TODOS = 'todos',
}

export enum BusinessOperation {
  BATCH = 'batch',
  CHECK = 'check',
  CREATE = 'create',
  FIND_ALL = 'findAll',
  FIND_ONE = 'findOne',
  INGEST = 'ingest',
  REMOVE = 'remove',
  UNKNOWN = 'unknown',
  UPDATE = 'update',
}

export enum BusinessStatus {
  FAILURE = 'failure',
  SUCCESS = 'success',
}

export enum HealthDependency {
  DATABASE = 'database',
  REDIS = 'redis',
  SHUTDOWN = 'shutdown',
}

export enum LogSource {
  MOBILE = 'mobile',
  WEB = 'web',
}

export class BusinessMetrics {
  private readonly businessRequestDuration: Histogram<string>;
  private readonly businessRequestsTotal: Counter<string>;
  private readonly clientLogsProcessed: Counter<string>;
  private readonly healthDependencyStatus: Gauge<string>;

  constructor() {
    this.businessRequestsTotal = new Counter({
      help: 'Total business requests by interface, operation, status, error category and code',
      labelNames: ['interface_type', 'operation', 'status', 'error_category', 'error_code'],
      name: 'business_requests_total',
    });

    this.businessRequestDuration = new Histogram({
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      help: 'Business request duration in seconds by interface, operation and status',
      labelNames: ['interface_type', 'operation', 'status'],
      name: 'business_request_duration_seconds',
    });

    this.clientLogsProcessed = new Counter({
      help: 'Client logs processed count by source and result status',
      labelNames: ['source', 'result'],
      name: 'client_logs_processed_total',
    });

    this.healthDependencyStatus = new Gauge({
      help: 'Health status of individual dependencies (1=up, 0=down)',
      labelNames: ['dependency'],
      name: 'health_dependency_status',
    });
  }

  recordClientLogBatch(source: LogSource, accepted: number, failed: number): void {
    if (accepted > 0) {
      this.clientLogsProcessed.labels({ result: 'accepted', source }).inc(accepted);
    }
    if (failed > 0) {
      this.clientLogsProcessed.labels({ result: 'failed', source }).inc(failed);
    }
  }

  recordHealthDependency(dependency: HealthDependency, isUp: boolean): void {
    this.healthDependencyStatus.set({ dependency }, isUp ? 1 : 0);
  }

  recordRequest(
    interfaceType: BusinessInterface,
    operation: BusinessOperation,
    status: BusinessStatus,
    durationSeconds: number,
    errorCategory?: string,
    errorCode?: string,
  ): void {
    const labels: Record<string, string> = {
      /* eslint-disable camelcase */
      error_category: errorCategory || 'NONE',
      error_code: errorCode || 'NONE',
      interface_type: interfaceType,
      /* eslint-enable camelcase */
      operation,
      status,
    };

    this.businessRequestsTotal.labels(labels).inc();
    this.businessRequestDuration
      .labels({
        /* eslint-disable camelcase */
        interface_type: interfaceType,
        /* eslint-enable camelcase */
        operation,
        status,
      })
      .observe(durationSeconds);
  }
}
