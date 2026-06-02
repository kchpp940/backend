import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Counter, Gauge, Histogram } from 'prom-client';
import { Observable } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { BaseError } from '../../../error-handler/errors/_base.error';
import { MetricsService } from '../metrics.service';
import { BusinessInterface, BusinessOperation, BusinessStatus } from '../metrics/business.metrics';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  private readonly httpInFlight = new Gauge({
    help: 'Number of HTTP requests currently being processed',
    name: 'http_requests_in_flight',
  });

  private readonly httpRequestDuration = new Histogram({
    buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'],
    name: 'http_request_duration_seconds',
  });

  private readonly httpRequestsTotal = new Counter({
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status'],
    name: 'http_requests_total',
  });

  constructor(private readonly metricsService: MetricsService) {}

  intercept<T>(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<Request>();
    const res = httpContext.getResponse<Response>();

    const method = req.method;

    const r = req.route as { path: string };
    const route = r.path || req.baseUrl || 'unknown';

    const start = process.hrtime();
    this.httpInFlight.inc();

    const interfaceType = this.detectInterfaceType(route);
    const operation = this.detectOperation(method, route);

    let businessMetricsRecorded = false;

    return next.handle().pipe(
      catchError((err: BaseError<unknown>) => {
        const status = err?.status || 500;
        this.recordMetrics(method, route, status, start);
        this.recordBusinessMetrics(interfaceType, operation, start, err);
        businessMetricsRecorded = true;
        throw err;
      }),
      finalize(() => {
        const status = res.statusCode;
        this.recordMetrics(method, route, status, start);
        if (!businessMetricsRecorded && status < 400) {
          this.recordBusinessMetrics(interfaceType, operation, start);
        }
      }),
    );
  }

  private detectInterfaceType(route: string): BusinessInterface {
    if (route.includes('todos')) return BusinessInterface.TODOS;
    if (route.includes('client-logs')) return BusinessInterface.CLIENT_LOGS;
    if (route.includes('health')) return BusinessInterface.HEALTH;

    return BusinessInterface.OTHER;
  }

  private detectOperation(method: string, route: string): BusinessOperation {
    const path = route.toLowerCase();

    if (path.includes('health')) {
      return BusinessOperation.CHECK;
    }

    if (path.includes('client-logs')) {
      return path.includes('batch') ? BusinessOperation.BATCH : BusinessOperation.INGEST;
    }

    if (path.includes('todos')) {
      switch (method) {
        case 'DELETE':
          return BusinessOperation.REMOVE;
        case 'GET':
          return path.includes(':id') ? BusinessOperation.FIND_ONE : BusinessOperation.FIND_ALL;
        case 'PATCH':
        case 'PUT':
          return BusinessOperation.UPDATE;
        case 'POST':
          return BusinessOperation.CREATE;
      }
    }

    return BusinessOperation.UNKNOWN;
  }

  private recordBusinessMetrics(
    interfaceType: BusinessInterface,
    operation: BusinessOperation,
    start: [number, number],
    err?: BaseError<unknown>,
  ): void {
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;

    const status = err ? BusinessStatus.FAILURE : BusinessStatus.SUCCESS;
    const errorCategory = err?.category;
    const errorCode = err?.code;

    this.metricsService.recordBusinessRequest(interfaceType, operation, status, duration, errorCategory, errorCode);
  }

  private recordMetrics(method: string, route: string, status: number, start: [number, number]): void {
    this.httpInFlight.dec();

    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;

    const statusStr = status.toString();

    this.httpRequestsTotal.labels(method, route, statusStr).inc();
    this.httpRequestDuration.labels(method, route, statusStr).observe(duration);
  }
}
