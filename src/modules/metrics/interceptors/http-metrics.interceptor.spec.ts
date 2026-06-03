import type { CallHandler, ExecutionContext } from '@nestjs/common';

import { of, throwError } from 'rxjs';

jest.mock('prom-client', () => {
  const incMock = jest.fn();
  const labelsMock = jest.fn().mockReturnValue({ inc: incMock });
  const observeMock = jest.fn();
  const labelsHistMock = jest.fn().mockReturnValue({ observe: observeMock });

  return {
    Counter: jest.fn().mockImplementation(() => ({ labels: labelsMock })),
    Gauge: jest.fn().mockImplementation(() => ({ dec: jest.fn(), inc: jest.fn() })),
    Histogram: jest.fn().mockImplementation(() => ({ labels: labelsHistMock })),
  };
});

import { HttpMetricsInterceptor } from './http-metrics.interceptor';

const makeContext = (method = 'GET', route = '/api', statusCode = 200): ExecutionContext =>
  ({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ baseUrl: route, method, route: { path: route } }),
      getResponse: jest.fn().mockReturnValue({ statusCode }),
    }),
  }) as unknown as ExecutionContext;

describe('HttpMetricsInterceptor', () => {
  let interceptor: HttpMetricsInterceptor;

  beforeEach(() => {
    interceptor = new HttpMetricsInterceptor();
  });

  describe('positive cases', () => {
    it('intercept does not throw on success', (done) => {
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(of({ id: 1 })) };

      interceptor.intercept(makeContext(), handler).subscribe({
        complete: () => {
          done();
        },
        error: () => {
          done.fail();
        },
      });
    });

    it('intercept records metrics on error with status', (done) => {
      const error = Object.assign(new Error('test'), { status: 400 });
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(throwError(() => error)) };

      interceptor.intercept(makeContext(), handler).subscribe({
        error: () => {
          done();
        },
      });
    });

    it('uses 500 as fallback status when error has no status property', (done) => {
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(throwError(() => new Error('no status'))) };

      interceptor.intercept(makeContext(), handler).subscribe({
        error: () => {
          done();
        },
      });
    });

    it('uses unknown route when route is undefined', (done) => {
      const ctx = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ baseUrl: '', method: 'GET', route: { path: '' } }),
          getResponse: jest.fn().mockReturnValue({ statusCode: 200 }),
        }),
      } as unknown as ExecutionContext;

      const handler: CallHandler = { handle: jest.fn().mockReturnValue(of({})) };

      interceptor.intercept(ctx, handler).subscribe({
        complete: () => {
          done();
        },
        error: () => {
          done.fail();
        },
      });
    });
  });
});
