import type { NextFunction, Request, Response } from 'express';

import type { LogConfigInterface } from '../../config/interfaces/log-config.interface';
import type { LoggerService } from '../logger.service';

import { loggingMiddleware } from './logging.middleware';

const makeConfig = (excludeEndpoints: string[] = []): LogConfigInterface =>
  ({ logExcludeEndpoints: excludeEndpoints }) as LogConfigInterface;

const makeLogger = (): { log: jest.Mock } => ({ log: jest.fn() });

const makeReq = (url: string, method = 'GET', body = {}): Request => ({ body, method, url }) as unknown as Request;

describe('loggingMiddleware', () => {
  describe('negative cases', () => {
    it('skips logging for /health endpoint', () => {
      const logger = makeLogger();
      const next = jest.fn() as NextFunction;
      const middleware = loggingMiddleware(makeConfig(), logger as unknown as LoggerService);

      middleware(makeReq('/health'), {} as Response, next);

      expect(logger.log).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('skips logging for /metrics endpoint', () => {
      const logger = makeLogger();
      const next = jest.fn() as NextFunction;
      const middleware = loggingMiddleware(makeConfig(), logger as unknown as LoggerService);

      middleware(makeReq('/metrics'), {} as Response, next);

      expect(logger.log).not.toHaveBeenCalled();
    });

    it('skips logging for custom excluded endpoints', () => {
      const logger = makeLogger();
      const next = jest.fn() as NextFunction;
      const middleware = loggingMiddleware(makeConfig(['/excluded']), logger as unknown as LoggerService);

      middleware(makeReq('/excluded'), {} as Response, next);

      expect(logger.log).not.toHaveBeenCalled();
    });
  });

  describe('positive cases', () => {
    it('logs request for non-excluded endpoints', () => {
      const logger = makeLogger();
      const next = jest.fn() as NextFunction;
      const middleware = loggingMiddleware(makeConfig(), logger as unknown as LoggerService);

      middleware(makeReq('/api/todos', 'POST', { title: 'test' }), {} as Response, next);

      expect(logger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: 'loggingMiddleware',
          method: 'POST',
          msg: 'Request income',
          path: '/api/todos',
        }),
      );
    });

    it('calls next after logging', () => {
      const logger = makeLogger();
      const next = jest.fn() as NextFunction;
      const middleware = loggingMiddleware(makeConfig(), logger as unknown as LoggerService);

      middleware(makeReq('/api/todos'), {} as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('serializes request body in log details', () => {
      const logger = makeLogger();
      const next = jest.fn() as NextFunction;
      const middleware = loggingMiddleware(makeConfig(), logger as unknown as LoggerService);
      const body = { title: 'test' };

      middleware(makeReq('/api/todos', 'POST', body), {} as Response, next);

      expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({ details: JSON.stringify(body) }));
    });
  });
});
