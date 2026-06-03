import type { ConfigType } from '@nestjs/config';

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Inject } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';
import { Counter } from 'prom-client';

import { sentryConfig } from '../../config/sentry.config';
import { HEALTH_ENDPOINT } from '../../constants/url.contants';
import { RequestTelemetryContext } from '../../logger/context/request-telemetry.context';
import { LoggerService } from '../../logger/logger.service';
import { BaseError } from '../errors/_base.error';
import { InternalServerError } from '../errors/common.errors';
import { frontendMapper } from '../mappers/frontend.mapper';
import { mapPrismaError } from '../mappers/prisma-error.mapper';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly httpErrors = new Counter({
    help: 'Total HTTP errors',
    labelNames: ['method', 'route', 'status', 'errorCategory'],
    name: 'http_errors_total',
  });

  constructor(
    private readonly loggerService: LoggerService,
    @Inject(sentryConfig.KEY)
    private configSentry: ConfigType<typeof sentryConfig>,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { userId?: string }>();
    const res = ctx.getResponse<Response>();

    RequestTelemetryContext.populateFromRequest(req);

    let error: BaseError<unknown> | null = null;

    if (exception instanceof BaseError) {
      error = exception;
    }

    if (!error) {
      error = mapPrismaError(exception);
    }

    if (!error && exception instanceof HttpException) {
      error = new InternalServerError();
    }

    if (!error) {
      error = new InternalServerError();
    }

    RequestTelemetryContext.populateFromError(error);

    const telemetry = RequestTelemetryContext.getRequiredAll();

    if (req.url.slice(1).indexOf(HEALTH_ENDPOINT) === 0 && exception instanceof HttpException) {
      res.status(200).json(exception.getResponse());

      return;
    }

    if (telemetry.status >= 400) {
      this.httpErrors
        .labels(telemetry.method, telemetry.route, telemetry.status.toString(), telemetry.errorCategory)
        .inc();
    }

    if (this.configSentry.sentryEnabled) {
      if (telemetry.userId) {
        Sentry.setUser({ userId: telemetry.userId });
      }

      Sentry.captureException(exception, {
        extra: {
          body: req.body,
          errorCategory: telemetry.errorCategory,
          params: req.params,
          query: req.query,
          route: telemetry.route,
          traceId: telemetry.traceId,
        },
      });
    }

    const infraError = exception instanceof HttpException;

    this.loggerService.error({
      code: error.code,
      ctx: GlobalExceptionFilter.name,
      details: infraError ? exception.getResponse() : error.details,
      errorCategory: telemetry.errorCategory,
      method: telemetry.method,
      msg: error.message,
      path: telemetry.path,
      route: telemetry.route,
      stack: exception instanceof Error ? exception.stack : undefined,
      traceId: telemetry.traceId,
    });

    res.status(telemetry.status).json({
      code: error.code,
      errorCategory: telemetry.errorCategory,
      message: error.message,
      status: telemetry.status,
      traceId: telemetry.traceId,
      ...(typeof error.details !== 'undefined' ? { details: frontendMapper(error.details) } : {}),
    });
  }
}
