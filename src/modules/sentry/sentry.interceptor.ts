import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs';

import { RequestTelemetryContext } from '../../logger/context/request-telemetry.context';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      catchError((err: Error) => {
        RequestTelemetryContext.populateFromRequest(req);
        RequestTelemetryContext.populateFromError(err);

        const telemetry = RequestTelemetryContext.getRequiredAll();

        Sentry.captureException(err, {
          extra: {
            body: req.body,
            errorCategory: telemetry.errorCategory,
            method: telemetry.method,
            route: telemetry.route,
            traceId: telemetry.traceId,
            url: telemetry.path,
          },
        });

        return throwError(() => err);
      }),
    );
  }
}
