import type { NextFunction, Request, Response } from 'express';

import type { LogConfigInterface } from '../../config/interfaces/log-config.interface';
import type { LoggerService } from '../logger.service';

import { HEALTH_ENDPOINT, METRICS_ENDPOINT } from '../../constants/url.contants';
import { RequestTelemetryContext } from '../context/request-telemetry.context';

export const loggingMiddleware =
  (config: LogConfigInterface, loggerService: LoggerService) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if ([`/${HEALTH_ENDPOINT}`, `/${METRICS_ENDPOINT}`, ...config.logExcludeEndpoints].includes(req.url)) {
      next();

      return;
    }

    const telemetry = RequestTelemetryContext.getRequiredAll();

    loggerService.log({
      ctx: 'loggingMiddleware',
      details: JSON.stringify(req.body),
      method: telemetry.method,
      msg: `Request income`,
      path: telemetry.path,
    });

    next();
  };
