import type { NextFunction, Request, Response } from 'express';

import type { LogConfigInterface } from '../../config/interfaces/log-config.interface';
import type { LoggerService } from '../logger.service';

import { HEALTH_ENDPOINT, METRICS_ENDPOINT } from '../../constants/url.contants';

export const loggingMiddleware =
  (config: LogConfigInterface, loggerService: LoggerService) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if ([`/${HEALTH_ENDPOINT}`, `/${METRICS_ENDPOINT}`, ...config.logExcludeEndpoints].includes(req.url)) {
      next();

      return;
    }

    loggerService.log({
      ctx: 'loggingMiddleware',
      details: JSON.stringify(req.body),
      method: req.method,
      msg: `Request income`,
      path: req.url,
    });

    next();
  };
