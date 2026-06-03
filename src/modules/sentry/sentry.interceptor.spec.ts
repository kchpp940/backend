import type { CallHandler, ExecutionContext } from '@nestjs/common';

import { of, throwError } from 'rxjs';

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
}));

import * as Sentry from '@sentry/node';

import { SentryInterceptor } from './sentry.interceptor';

const makeContext = (): ExecutionContext =>
  ({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ body: {}, method: 'GET', url: '/api' }),
    }),
  }) as unknown as ExecutionContext;

describe('SentryInterceptor', () => {
  let interceptor: SentryInterceptor;

  beforeEach(() => {
    interceptor = new SentryInterceptor();
    jest.clearAllMocks();
  });

  describe('negative cases', () => {
    it('captures exception and rethrows on error', (done) => {
      const error = new Error('test error');
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(throwError(() => error)) };

      interceptor.intercept(makeContext(), handler).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(Sentry.captureException).toHaveBeenCalledWith(error, expect.any(Object));
          done();
        },
      });
    });
  });

  describe('positive cases', () => {
    it('passes through successful responses without capturing', (done) => {
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(of({ id: 1 })) };

      interceptor.intercept(makeContext(), handler).subscribe({
        complete: () => {
          expect(Sentry.captureException).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
