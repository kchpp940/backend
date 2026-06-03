import type { NextFunction, Request, Response } from 'express';

jest.mock('@sentry/node', () => ({
  setContext: jest.fn(),
  setTag: jest.fn(),
  setUser: jest.fn(),
}));

import Sentry from '@sentry/node';

import { RequestTelemetryContext } from '../../../logger/context/request-telemetry.context';
import { sentryContextMiddleware } from './sentry-context.middleware';

const runInContext = <T>(callback: () => T): T => RequestTelemetryContext.run('test-trace', callback);

describe('sentryContextMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('positive cases', () => {
    it('sets traceId tag and request context', () => {
      const req = { method: 'GET', url: '/api/todos' } as Request;
      const next = jest.fn() as NextFunction;

      runInContext(() => sentryContextMiddleware()(req, {} as Response, next));

      expect(Sentry.setTag).toHaveBeenCalledWith('traceId', 'test-trace');
      expect(Sentry.setTag).toHaveBeenCalledWith('route', expect.any(String));
      expect(Sentry.setTag).toHaveBeenCalledWith('method', 'GET');
      expect(Sentry.setContext).toHaveBeenCalledWith('request', {
        method: 'GET',
        route: '',
        url: '/api/todos',
      });
    });

    it('calls next', () => {
      const req = { method: 'POST', url: '/api' } as Request;
      const next = jest.fn() as NextFunction;

      runInContext(() => sentryContextMiddleware()(req, {} as Response, next));

      expect(next).toHaveBeenCalled();
    });

    it('sets Sentry user when userId present', () => {
      const req = { method: 'GET', url: '/api', userId: 'user-123' } as Request & { userId: string };
      const next = jest.fn() as NextFunction;

      runInContext(() => sentryContextMiddleware()(req, {} as Response, next));

      expect(Sentry.setUser).toHaveBeenCalledWith({ userId: 'user-123' });
    });
  });
});
