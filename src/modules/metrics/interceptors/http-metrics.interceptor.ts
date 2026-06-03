import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Counter, Gauge, Histogram } from 'prom-client';
import { Observable } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { RequestTelemetryContext } from '../../../logger/context/request-telemetry.context';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  private readonly httpInFlight = new Gauge({
    help: 'Number of HTTP requests currently being processed',
    name: 'http_requests_in_flight',
  });

  private readonly httpRequestDuration = new Histogram({
    buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status', 'errorCategory'],
    name: 'http_request_duration_seconds',
  });

  private readonly httpRequestsTotal = new Counter({
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status', 'errorCategory'],
    name: 'http_requests_total',
  });

  intercept<T>(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<Request>();
    const res = httpContext.getResponse<Response>();

    RequestTelemetryContext.populateFromRequest(req);

    const start = process.hrtime();
    this.httpInFlight.inc();

    return next.handle().pipe(
      catchError((err: Error) => {
        RequestTelemetryContext.populateFromError(err);
        const telemetry = RequestTelemetryContext.getRequiredAll();
        this.recordMetrics(telemetry.method, telemetry.route, telemetry.status, telemetry.errorCategory, start);
        throw err;
      }),
      finalize(() => {
        RequestTelemetryContext.populateFromResponse(res);
        const telemetry = RequestTelemetryContext.getRequiredAll();
        this.recordMetrics(telemetry.method, telemetry.route, telemetry.status, telemetry.errorCategory, start);
      }),
    );
  }

  private recordMetrics(
    method: string,
    route: string,
    status: number,
    errorCategory: string,
    start: [number, number],
  ): void {
    this.httpInFlight.dec();

    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;

    const statusStr = status.toString();

    this.httpRequestsTotal.labels(method, route, statusStr, errorCategory).inc();
    this.httpRequestDuration.labels(method, route, statusStr, errorCategory).observe(duration);
  }
}
