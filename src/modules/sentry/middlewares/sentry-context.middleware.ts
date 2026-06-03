import type { NextFunction, Request, Response } from 'express';

import Sentry from '@sentry/node';

import { RequestTelemetryContext } from '../../../logger/context/request-telemetry.context';

export const sentryContextMiddleware =
  () =>
  (req: Request & { userId?: string }, res: Response, next: NextFunction): void => {
    RequestTelemetryContext.populateFromRequest(req);

    const telemetry = RequestTelemetryContext.getRequiredAll();

    Sentry.setTag('traceId', telemetry.traceId);
    Sentry.setTag('route', telemetry.route);
    Sentry.setTag('method', telemetry.method);
    Sentry.setContext('request', {
      method: telemetry.method,
      route: telemetry.route,
      url: telemetry.path,
    });

    if (telemetry.userId) {
      Sentry.setUser({ userId: telemetry.userId });
    }

    next();
  };
