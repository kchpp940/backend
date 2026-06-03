import type { Request, Response } from 'express';

import { HttpException, HttpStatus } from '@nestjs/common';

import type { TelemetryReporter } from './telemetry-reporter.types';

import { ErrorCategory } from '../../error-handler/constants/error-category';
import { BaseError } from '../../error-handler/errors/_base.error';
import { InternalServerError } from '../../error-handler/errors/common.errors';
import { RequestTelemetryContext } from './request-telemetry.context';

describe('RequestTelemetryContext', () => {
  describe('negative cases', () => {
    it('returns default values when no context is set', () => {
      expect(RequestTelemetryContext.getTraceId()).toBe('');
      expect(RequestTelemetryContext.getMethod()).toBe('');
      expect(RequestTelemetryContext.getRoute()).toBe('unknown');
      expect(RequestTelemetryContext.getPath()).toBe('');
      expect(RequestTelemetryContext.getStatus()).toBe(0);
      expect(RequestTelemetryContext.getErrorCategory()).toBe(ErrorCategory.UNKNOWN);
      expect(RequestTelemetryContext.getError()).toBeNull();
      expect(RequestTelemetryContext.getUserId()).toBeUndefined();
    });

    it('setters are no-ops when no store is active', () => {
      RequestTelemetryContext.setTraceId('leak');
      RequestTelemetryContext.setMethod('LEAK');
      RequestTelemetryContext.setRoute('/leak');
      RequestTelemetryContext.setPath('/leak');
      RequestTelemetryContext.setStatus(999);
      RequestTelemetryContext.setErrorCategory(ErrorCategory.DOMAIN);
      RequestTelemetryContext.setError(new Error('leak'));
      RequestTelemetryContext.setUserId('leak-user');

      expect(RequestTelemetryContext.getTraceId()).toBe('');
      expect(RequestTelemetryContext.getMethod()).toBe('');
      expect(RequestTelemetryContext.getRoute()).toBe('unknown');
      expect(RequestTelemetryContext.getPath()).toBe('');
      expect(RequestTelemetryContext.getStatus()).toBe(0);
      expect(RequestTelemetryContext.getErrorCategory()).toBe(ErrorCategory.UNKNOWN);
      expect(RequestTelemetryContext.getError()).toBeNull();
      expect(RequestTelemetryContext.getUserId()).toBeUndefined();
    });

    it('populateFromRequest is a no-op when no store is active', () => {
      const req = {
        headers: { 'x-trace-id': 'leak' },
        method: 'LEAK',
        url: '/leak',
      } as unknown as Request;

      RequestTelemetryContext.populateFromRequest(req);

      expect(RequestTelemetryContext.getTraceId()).toBe('');
      expect(RequestTelemetryContext.getMethod()).toBe('');
    });

    it('populateFromError is a no-op when no store is active', () => {
      RequestTelemetryContext.populateFromError(new InternalServerError());

      expect(RequestTelemetryContext.getStatus()).toBe(0);
      expect(RequestTelemetryContext.getErrorCategory()).toBe(ErrorCategory.UNKNOWN);
    });

    it('populateFromResponse is a no-op when no store is active', () => {
      const res = { statusCode: 200 } as unknown as Response;

      RequestTelemetryContext.populateFromResponse(res);

      expect(RequestTelemetryContext.getStatus()).toBe(0);
    });

    it('isContextAvailable returns false outside run()', () => {
      expect(RequestTelemetryContext.isContextAvailable()).toBe(false);
    });
  });

  describe('required API (degradation events)', () => {
    it('getRequiredAll returns defaults when no context', () => {
      const result = RequestTelemetryContext.getRequiredAll();

      expect(result.traceId).toBe('');
      expect(result.method).toBe('');
      expect(result.status).toBe(0);
    });

    it('getRequiredTraceId returns empty when no context', () => {
      const result = RequestTelemetryContext.getRequiredTraceId();

      expect(result).toBe('');
    });

    it('getRequiredRoute returns unknown when no context', () => {
      const result = RequestTelemetryContext.getRequiredRoute();

      expect(result).toBe('unknown');
    });

    it('getRequiredStatus returns 0 when no context', () => {
      const result = RequestTelemetryContext.getRequiredStatus();

      expect(result).toBe(0);
    });

    it('getRequiredErrorCategory returns UNKNOWN when no context', () => {
      const result = RequestTelemetryContext.getRequiredErrorCategory();

      expect(result).toBe(ErrorCategory.UNKNOWN);
    });

    it('getRequiredAll triggers registered reporter with field "all"', () => {
      const reportDegradationMock = jest.fn();
      const mockReporter: TelemetryReporter = {
        reportDegradation: reportDegradationMock,
      };

      RequestTelemetryContext.registerReporter(mockReporter);
      RequestTelemetryContext.getRequiredAll();

      const call = reportDegradationMock.mock.calls[0] as unknown[];
      const event = call[0] as { caller: string; field: string };
      expect(event.field).toBe('all');
      expect(typeof event.caller).toBe('string');
      expect(event.caller.length).toBeGreaterThan(0);
    });

    it('getRequiredTraceId triggers reporter with field "traceId"', () => {
      const reportDegradationMock = jest.fn();
      const mockReporter: TelemetryReporter = {
        reportDegradation: reportDegradationMock,
      };

      RequestTelemetryContext.registerReporter(mockReporter);
      RequestTelemetryContext.getRequiredTraceId();

      const call = reportDegradationMock.mock.calls[0] as unknown[];
      const event = call[0] as { field: string };
      expect(event.field).toBe('traceId');
    });

    it('getRequiredRoute triggers reporter with field "route"', () => {
      const reportDegradationMock = jest.fn();
      const mockReporter: TelemetryReporter = {
        reportDegradation: reportDegradationMock,
      };

      RequestTelemetryContext.registerReporter(mockReporter);
      RequestTelemetryContext.getRequiredRoute();

      const call = reportDegradationMock.mock.calls[0] as unknown[];
      const event = call[0] as { field: string };
      expect(event.field).toBe('route');
    });

    it('getRequiredStatus triggers reporter with field "status"', () => {
      const reportDegradationMock = jest.fn();
      const mockReporter: TelemetryReporter = {
        reportDegradation: reportDegradationMock,
      };

      RequestTelemetryContext.registerReporter(mockReporter);
      RequestTelemetryContext.getRequiredStatus();

      const call = reportDegradationMock.mock.calls[0] as unknown[];
      const event = call[0] as { field: string };
      expect(event.field).toBe('status');
    });

    it('getRequiredErrorCategory triggers reporter with field "errorCategory"', () => {
      const reportDegradationMock = jest.fn();
      const mockReporter: TelemetryReporter = {
        reportDegradation: reportDegradationMock,
      };

      RequestTelemetryContext.registerReporter(mockReporter);
      RequestTelemetryContext.getRequiredErrorCategory();

      const call = reportDegradationMock.mock.calls[0] as unknown[];
      const event = call[0] as { field: string };
      expect(event.field).toBe('errorCategory');
    });

    it('getRequiredMethod triggers reporter with field "method"', () => {
      const reportDegradationMock = jest.fn();
      const mockReporter: TelemetryReporter = {
        reportDegradation: reportDegradationMock,
      };

      RequestTelemetryContext.registerReporter(mockReporter);
      RequestTelemetryContext.getRequiredMethod();

      const call = reportDegradationMock.mock.calls[0] as unknown[];
      const event = call[0] as { field: string };
      expect(event.field).toBe('method');
    });

    it('getRequiredPath triggers reporter with field "path"', () => {
      const reportDegradationMock = jest.fn();
      const mockReporter: TelemetryReporter = {
        reportDegradation: reportDegradationMock,
      };

      RequestTelemetryContext.registerReporter(mockReporter);
      RequestTelemetryContext.getRequiredPath();

      const call = reportDegradationMock.mock.calls[0] as unknown[];
      const event = call[0] as { field: string };
      expect(event.field).toBe('path');
    });

    it('getRequiredError triggers reporter with field "error"', () => {
      const reportDegradationMock = jest.fn();
      const mockReporter: TelemetryReporter = {
        reportDegradation: reportDegradationMock,
      };

      RequestTelemetryContext.registerReporter(mockReporter);
      RequestTelemetryContext.getRequiredError();

      const call = reportDegradationMock.mock.calls[0] as unknown[];
      const event = call[0] as { field: string };
      expect(event.field).toBe('error');
    });

    it('getRequiredUserId triggers reporter with field "userId"', () => {
      const reportDegradationMock = jest.fn();
      const mockReporter: TelemetryReporter = {
        reportDegradation: reportDegradationMock,
      };

      RequestTelemetryContext.registerReporter(mockReporter);
      RequestTelemetryContext.getRequiredUserId();

      const call = reportDegradationMock.mock.calls[0] as unknown[];
      const event = call[0] as { field: string };
      expect(event.field).toBe('userId');
    });

    it('does NOT trigger reporter inside run() context', () => {
      const reportDegradationMock = jest.fn();
      const mockReporter: TelemetryReporter = {
        reportDegradation: reportDegradationMock,
      };

      RequestTelemetryContext.registerReporter(mockReporter);

      RequestTelemetryContext.run('test-trace', () => {
        RequestTelemetryContext.getRequiredAll();
        RequestTelemetryContext.getRequiredTraceId();
        RequestTelemetryContext.getRequiredRoute();
      });

      expect(reportDegradationMock).not.toHaveBeenCalled();
    });

    it('supports multiple reporters', () => {
      const firstReportMock = jest.fn();
      const secondReportMock = jest.fn();
      const firstReporter: TelemetryReporter = {
        reportDegradation: firstReportMock,
      };
      const secondReporter: TelemetryReporter = {
        reportDegradation: secondReportMock,
      };

      RequestTelemetryContext.registerReporter(firstReporter);
      RequestTelemetryContext.registerReporter(secondReporter);

      RequestTelemetryContext.getRequiredAll();

      expect(firstReportMock).toHaveBeenCalled();
      expect(secondReportMock).toHaveBeenCalled();
    });

    it('handles reporter errors gracefully', () => {
      const errorReporter: TelemetryReporter = {
        reportDegradation: () => {
          throw new Error('Reporter failed');
        },
      };

      RequestTelemetryContext.registerReporter(errorReporter);

      expect(() => RequestTelemetryContext.getRequiredAll()).not.toThrow();
    });

    it('getRequiredAll does NOT degrade inside run()', () => {
      RequestTelemetryContext.run('test-trace', () => {
        const result = RequestTelemetryContext.getRequiredAll();

        expect(result.traceId).toBe('test-trace');
      });
    });

    it('getRequiredTraceId does NOT degrade inside run()', () => {
      RequestTelemetryContext.run('test-trace', () => {
        const result = RequestTelemetryContext.getRequiredTraceId();

        expect(result).toBe('test-trace');
      });
    });

    it('getRequiredMethod returns method inside run()', () => {
      RequestTelemetryContext.run('test-trace', () => {
        RequestTelemetryContext.setMethod('GET');

        const result = RequestTelemetryContext.getRequiredMethod();

        expect(result).toBe('GET');
      });
    });

    it('getRequiredPath returns path inside run()', () => {
      RequestTelemetryContext.run('test-trace', () => {
        RequestTelemetryContext.setPath('/api/todos');

        const result = RequestTelemetryContext.getRequiredPath();

        expect(result).toBe('/api/todos');
      });
    });

    it('getRequiredUserId returns userId inside run()', () => {
      RequestTelemetryContext.run('test-trace', () => {
        RequestTelemetryContext.setUserId('user-123');

        const result = RequestTelemetryContext.getRequiredUserId();

        expect(result).toBe('user-123');
      });
    });
  });

  describe('positive cases', () => {
    it('returns traceId set via run', () => {
      RequestTelemetryContext.run('abc-123', () => {
        expect(RequestTelemetryContext.getTraceId()).toBe('abc-123');
      });
    });

    it('isolates context per run call', () => {
      let inner = '';

      RequestTelemetryContext.run('outer', () => {
        RequestTelemetryContext.run('inner', () => {
          inner = RequestTelemetryContext.getTraceId();
        });

        expect(RequestTelemetryContext.getTraceId()).toBe('outer');
        expect(inner).toBe('inner');
      });
    });

    it('returns empty string outside run callback', () => {
      RequestTelemetryContext.run('temp', () => {
        expect(RequestTelemetryContext.getTraceId()).toBe('temp');
      });

      expect(RequestTelemetryContext.getTraceId()).toBe('');
    });

    it('isContextAvailable returns true inside run()', () => {
      RequestTelemetryContext.run('test', () => {
        expect(RequestTelemetryContext.isContextAvailable()).toBe(true);
      });
    });
  });

  describe('setters', () => {
    it('sets and gets all telemetry fields', () => {
      RequestTelemetryContext.run('trace-123', () => {
        RequestTelemetryContext.setMethod('GET');
        RequestTelemetryContext.setRoute('/api/todos/:id');
        RequestTelemetryContext.setPath('/api/todos/1');
        RequestTelemetryContext.setStatus(200);
        RequestTelemetryContext.setErrorCategory(ErrorCategory.VALIDATION);
        RequestTelemetryContext.setUserId('user-456');

        expect(RequestTelemetryContext.getTraceId()).toBe('trace-123');
        expect(RequestTelemetryContext.getMethod()).toBe('GET');
        expect(RequestTelemetryContext.getRoute()).toBe('/api/todos/:id');
        expect(RequestTelemetryContext.getPath()).toBe('/api/todos/1');
        expect(RequestTelemetryContext.getStatus()).toBe(200);
        expect(RequestTelemetryContext.getErrorCategory()).toBe(ErrorCategory.VALIDATION);
        expect(RequestTelemetryContext.getUserId()).toBe('user-456');
      });
    });

    it('getAll returns all fields', () => {
      RequestTelemetryContext.run('trace-456', () => {
        RequestTelemetryContext.setMethod('POST');
        RequestTelemetryContext.setStatus(201);

        const all = RequestTelemetryContext.getAll();

        expect(all.traceId).toBe('trace-456');
        expect(all.method).toBe('POST');
        expect(all.status).toBe(201);
        expect(all.errorCategory).toBe(ErrorCategory.UNKNOWN);
      });
    });

    it('getRequiredAll returns all fields inside run()', () => {
      RequestTelemetryContext.run('trace-789', () => {
        RequestTelemetryContext.setMethod('PATCH');
        RequestTelemetryContext.setStatus(400);
        RequestTelemetryContext.setErrorCategory(ErrorCategory.VALIDATION);

        const all = RequestTelemetryContext.getRequiredAll();

        expect(all.traceId).toBe('trace-789');
        expect(all.method).toBe('PATCH');
        expect(all.status).toBe(400);
        expect(all.errorCategory).toBe(ErrorCategory.VALIDATION);
      });
    });
  });

  describe('extractErrorCategory', () => {
    it('extracts category from BaseError', () => {
      const error = new InternalServerError();
      expect(RequestTelemetryContext.extractErrorCategory(error)).toBe(ErrorCategory.APPLICATION);
    });

    it('extracts category from HttpException', () => {
      const error = new HttpException('Not Found', 404);
      expect(RequestTelemetryContext.extractErrorCategory(error)).toBe(ErrorCategory.APPLICATION);
    });

    it('extracts category from generic Error', () => {
      const error = new Error('Something went wrong');
      expect(RequestTelemetryContext.extractErrorCategory(error)).toBe(ErrorCategory.UNKNOWN);
    });

    it('returns UNKNOWN for non-Error values', () => {
      expect(RequestTelemetryContext.extractErrorCategory('string error')).toBe(ErrorCategory.UNKNOWN);
      expect(RequestTelemetryContext.extractErrorCategory(404)).toBe(ErrorCategory.UNKNOWN);
      expect(RequestTelemetryContext.extractErrorCategory(null)).toBe(ErrorCategory.UNKNOWN);
    });
  });

  describe('extractStatus', () => {
    it('extracts status from BaseError', () => {
      const error = new InternalServerError();
      expect(RequestTelemetryContext.extractStatus(error)).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('extracts status from HttpException', () => {
      const error = new HttpException('Not Found', 404);
      expect(RequestTelemetryContext.extractStatus(error)).toBe(404);
    });

    it('returns 500 for generic Error', () => {
      const error = new Error('Something went wrong');
      expect(RequestTelemetryContext.extractStatus(error)).toBe(500);
    });
  });

  describe('populateFromRequest', () => {
    it('populates telemetry from express request', () => {
      RequestTelemetryContext.run('test-trace', () => {
        const req = {
          baseUrl: '/api',
          headers: { 'x-trace-id': 'header-trace' },
          method: 'PUT',
          route: { path: '/todos/:id' },
          url: '/api/todos/123',
          userId: 'user-789',
        } as unknown as Request & { userId?: string };

        RequestTelemetryContext.populateFromRequest(req);

        expect(RequestTelemetryContext.getTraceId()).toBe('header-trace');
        expect(RequestTelemetryContext.getMethod()).toBe('PUT');
        expect(RequestTelemetryContext.getRoute()).toBe('/todos/:id');
        expect(RequestTelemetryContext.getPath()).toBe('/api/todos/123');
        expect(RequestTelemetryContext.getUserId()).toBe('user-789');
      });
    });

    it('uses baseUrl when route.path is not available', () => {
      RequestTelemetryContext.run('test-trace', () => {
        const req = {
          baseUrl: '/api/todos',
          headers: {},
          method: 'DELETE',
          url: '/api/todos/123',
        } as unknown as Request;

        RequestTelemetryContext.populateFromRequest(req);

        expect(RequestTelemetryContext.getRoute()).toBe('/api/todos');
      });
    });
  });

  describe('populateFromResponse', () => {
    it('populates status from express response', () => {
      RequestTelemetryContext.run('test-trace', () => {
        const res = {
          statusCode: 200,
        } as unknown as Response;

        RequestTelemetryContext.populateFromResponse(res);

        expect(RequestTelemetryContext.getStatus()).toBe(200);
      });
    });

    it('does not override existing status', () => {
      RequestTelemetryContext.run('test-trace', () => {
        RequestTelemetryContext.setStatus(404);
        const res = { statusCode: 200 } as unknown as Response;

        RequestTelemetryContext.populateFromResponse(res);

        expect(RequestTelemetryContext.getStatus()).toBe(404);
      });
    });
  });

  describe('populateFromError', () => {
    it('populates telemetry from BaseError', () => {
      RequestTelemetryContext.run('test-trace', () => {
        const error = new InternalServerError();

        RequestTelemetryContext.populateFromError(error);

        expect(RequestTelemetryContext.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(RequestTelemetryContext.getErrorCategory()).toBe(ErrorCategory.APPLICATION);
        expect(RequestTelemetryContext.getError()).toBe(error);
      });
    });

    it('populates telemetry from HttpException', () => {
      RequestTelemetryContext.run('test-trace', () => {
        const error = new HttpException('Bad Request', 400);

        RequestTelemetryContext.populateFromError(error);

        expect(RequestTelemetryContext.getStatus()).toBe(400);
        expect(RequestTelemetryContext.getErrorCategory()).toBe(ErrorCategory.APPLICATION);
        expect(RequestTelemetryContext.getError()).toBe(error);
      });
    });

    it('wraps non-Error values in InternalServerError', () => {
      RequestTelemetryContext.run('test-trace', () => {
        RequestTelemetryContext.populateFromError('string error');

        expect(RequestTelemetryContext.getStatus()).toBe(500);
        expect(RequestTelemetryContext.getErrorCategory()).toBe(ErrorCategory.UNKNOWN);
        expect(RequestTelemetryContext.getError()).toBeInstanceOf(BaseError);
      });
    });
  });

  describe('setError', () => {
    it('sets error and updates errorCategory', () => {
      RequestTelemetryContext.run('test-trace', () => {
        const error = new InternalServerError();

        RequestTelemetryContext.setError(error);

        expect(RequestTelemetryContext.getError()).toBe(error);
        expect(RequestTelemetryContext.getErrorCategory()).toBe(ErrorCategory.APPLICATION);
      });
    });

    it('clears error when null is passed', () => {
      RequestTelemetryContext.run('test-trace', () => {
        RequestTelemetryContext.setError(new InternalServerError());
        RequestTelemetryContext.setError(null);

        expect(RequestTelemetryContext.getError()).toBeNull();
      });
    });
  });
});
