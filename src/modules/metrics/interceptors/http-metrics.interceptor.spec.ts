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

import type { MetricsService } from '../metrics.service';

import { BusinessInterface, BusinessOperation, BusinessStatus } from '../metrics/business.metrics';
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
  let metricsService: { recordBusinessRequest: jest.Mock };

  beforeEach(() => {
    metricsService = {
      recordBusinessRequest: jest.fn(),
    };
    interceptor = new HttpMetricsInterceptor(metricsService as unknown as MetricsService);
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

    it('records business metrics with error info on failure', (done) => {
      const error = Object.assign(new Error('test'), {
        category: 'DOMAIN',
        code: 'TODO_NOT_FOUND',
        status: 404,
      });
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(throwError(() => error)) };

      interceptor.intercept(makeContext('GET', '/api/v1/todos/:id'), handler).subscribe({
        error: () => {
          expect(metricsService.recordBusinessRequest).toHaveBeenCalledWith(
            BusinessInterface.TODOS,
            BusinessOperation.FIND_ONE,
            BusinessStatus.FAILURE,
            expect.any(Number),
            'DOMAIN',
            'TODO_NOT_FOUND',
          );
          done();
        },
      });
    });

    it('correctly detects todos interface type', () => {
      expect(interceptor['detectInterfaceType']('/api/v1/todos')).toBe(BusinessInterface.TODOS);
      expect(interceptor['detectInterfaceType']('/api/v1/todos/:id')).toBe(BusinessInterface.TODOS);
    });

    it('correctly detects client-logs interface type', () => {
      expect(interceptor['detectInterfaceType']('/api/v1/client-logs/web')).toBe(BusinessInterface.CLIENT_LOGS);
      expect(interceptor['detectInterfaceType']('/api/v1/client-logs/mobile')).toBe(BusinessInterface.CLIENT_LOGS);
    });

    it('correctly detects health interface type', () => {
      expect(interceptor['detectInterfaceType']('/health')).toBe(BusinessInterface.HEALTH);
      expect(interceptor['detectInterfaceType']('/health/deps')).toBe(BusinessInterface.HEALTH);
    });

    it('correctly detects other interface type', () => {
      expect(interceptor['detectInterfaceType']('/api/v1/users')).toBe(BusinessInterface.OTHER);
      expect(interceptor['detectInterfaceType']('/unknown')).toBe(BusinessInterface.OTHER);
    });

    it('correctly detects create operation for todos', () => {
      expect(interceptor['detectOperation']('POST', '/api/v1/todos')).toBe(BusinessOperation.CREATE);
    });

    it('correctly detects findAll operation for todos', () => {
      expect(interceptor['detectOperation']('GET', '/api/v1/todos')).toBe(BusinessOperation.FIND_ALL);
    });

    it('correctly detects findOne operation for todos', () => {
      expect(interceptor['detectOperation']('GET', '/api/v1/todos/:id')).toBe(BusinessOperation.FIND_ONE);
    });

    it('correctly detects update operation for todos', () => {
      expect(interceptor['detectOperation']('PATCH', '/api/v1/todos/:id')).toBe(BusinessOperation.UPDATE);
      expect(interceptor['detectOperation']('PUT', '/api/v1/todos/:id')).toBe(BusinessOperation.UPDATE);
    });

    it('correctly detects remove operation for todos', () => {
      expect(interceptor['detectOperation']('DELETE', '/api/v1/todos/:id')).toBe(BusinessOperation.REMOVE);
    });

    it('correctly detects ingest operation for client-logs single', () => {
      expect(interceptor['detectOperation']('POST', '/api/v1/client-logs/web')).toBe(BusinessOperation.INGEST);
      expect(interceptor['detectOperation']('POST', '/api/v1/client-logs/mobile')).toBe(BusinessOperation.INGEST);
    });

    it('correctly detects batch operation for client-logs batch', () => {
      expect(interceptor['detectOperation']('POST', '/api/v1/client-logs/batch/web')).toBe(BusinessOperation.BATCH);
      expect(interceptor['detectOperation']('POST', '/api/v1/client-logs/batch/mobile')).toBe(BusinessOperation.BATCH);
    });

    it('correctly detects check operation for health', () => {
      expect(interceptor['detectOperation']('GET', '/health')).toBe(BusinessOperation.CHECK);
    });

    it('correctly detects unknown operation', () => {
      expect(interceptor['detectOperation']('GET', '/api/v1/users')).toBe(BusinessOperation.UNKNOWN);
    });
  });
});
