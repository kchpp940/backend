import type { Request, Response } from 'express';

import { HttpException } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

import type { TelemetryReporter } from './telemetry-reporter.types';

import { ErrorCategory } from '../../error-handler/constants/error-category';
import { BaseError } from '../../error-handler/errors/_base.error';
import { InternalServerError } from '../../error-handler/errors/common.errors';
import { mapPrismaError } from '../../error-handler/mappers/prisma-error.mapper';
import { traceIdHeader } from '../headers/trace-id.header';

type RequiredField = 'all' | keyof TelemetryData;

interface TelemetryData {
  error: Error | null;
  errorCategory: ErrorCategory;
  method: string;
  path: string;
  route: string;
  status: number;
  traceId: string;
  userId?: string;
}

const DEFAULT_TELEMETRY: Readonly<TelemetryData> = {
  error: null,
  errorCategory: ErrorCategory.UNKNOWN,
  method: '',
  path: '',
  route: '',
  status: 0,
  traceId: '',
};

export class RequestTelemetryContext {
  private static reporters: TelemetryReporter[] = [];
  private static storage = new AsyncLocalStorage<TelemetryData>();

  static extractErrorCategory(error: unknown): ErrorCategory {
    if (error instanceof BaseError) {
      return error.category;
    }

    const prismaError = mapPrismaError(error);
    if (prismaError) {
      return prismaError.category;
    }

    if (error instanceof HttpException) {
      return ErrorCategory.APPLICATION;
    }

    if (error instanceof Error) {
      return ErrorCategory.UNKNOWN;
    }

    return ErrorCategory.UNKNOWN;
  }

  static extractStatus(error: unknown): number {
    if (error instanceof BaseError) {
      return error.status;
    }

    const prismaError = mapPrismaError(error);
    if (prismaError) {
      return prismaError.status;
    }

    if (error instanceof HttpException) {
      return error.getStatus();
    }

    return 500;
  }

  static getAll(): Readonly<TelemetryData> {
    const store = this.storage.getStore();
    if (store) {
      return { ...store };
    }

    return { ...DEFAULT_TELEMETRY };
  }

  static getError(): Error | null {
    return this.storage.getStore()?.error ?? DEFAULT_TELEMETRY.error;
  }

  static getErrorCategory(): ErrorCategory {
    return this.storage.getStore()?.errorCategory ?? DEFAULT_TELEMETRY.errorCategory;
  }

  static getMethod(): string {
    return this.storage.getStore()?.method ?? DEFAULT_TELEMETRY.method;
  }

  static getPath(): string {
    return this.storage.getStore()?.path ?? DEFAULT_TELEMETRY.path;
  }

  static getRequiredAll(): Readonly<TelemetryData> {
    const store = this.storage.getStore();
    if (store) {
      return { ...store };
    }

    this.reportDegradation('all');

    return { ...DEFAULT_TELEMETRY };
  }

  static getRequiredError(): Error | null {
    const store = this.storage.getStore();
    if (store) {
      return store.error;
    }

    this.reportDegradation('error');

    return DEFAULT_TELEMETRY.error;
  }

  static getRequiredErrorCategory(): ErrorCategory {
    const store = this.storage.getStore();
    if (store) {
      return store.errorCategory;
    }

    this.reportDegradation('errorCategory');

    return DEFAULT_TELEMETRY.errorCategory;
  }

  static getRequiredMethod(): string {
    const store = this.storage.getStore();
    if (store) {
      return store.method;
    }

    this.reportDegradation('method');

    return DEFAULT_TELEMETRY.method;
  }

  static getRequiredPath(): string {
    const store = this.storage.getStore();
    if (store) {
      return store.path;
    }

    this.reportDegradation('path');

    return DEFAULT_TELEMETRY.path;
  }

  static getRequiredRoute(): string {
    const store = this.storage.getStore();
    if (!store) {
      this.reportDegradation('route');

      return 'unknown';
    }

    return store.route || store.path || 'unknown';
  }

  static getRequiredStatus(): number {
    const store = this.storage.getStore();
    if (store) {
      return store.status;
    }

    this.reportDegradation('status');

    return DEFAULT_TELEMETRY.status;
  }

  static getRequiredTraceId(): string {
    const store = this.storage.getStore();
    if (store) {
      return store.traceId;
    }

    this.reportDegradation('traceId');

    return DEFAULT_TELEMETRY.traceId;
  }

  static getRequiredUserId(): string | undefined {
    const store = this.storage.getStore();
    if (store) {
      return store.userId;
    }

    this.reportDegradation('userId');

    return undefined;
  }

  static getRoute(): string {
    const store = this.storage.getStore();
    if (!store) {
      return 'unknown';
    }

    return store.route || store.path || 'unknown';
  }

  static getStatus(): number {
    return this.storage.getStore()?.status ?? DEFAULT_TELEMETRY.status;
  }

  static getTraceId(): string {
    return this.storage.getStore()?.traceId ?? DEFAULT_TELEMETRY.traceId;
  }

  static getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }

  static isContextAvailable(): boolean {
    return this.storage.getStore() !== undefined;
  }

  static populateFromError(error: unknown): void {
    const store = this.storage.getStore();
    if (!store) {
      return;
    }

    store.status = this.extractStatus(error);
    store.errorCategory = this.extractErrorCategory(error);
    if (error instanceof Error) {
      store.error = error;
    } else {
      store.error = new InternalServerError();
    }
  }

  static populateFromRequest(req: Request): void {
    const store = this.storage.getStore();
    if (!store) {
      return;
    }

    store.traceId = (req.headers?.[traceIdHeader] as string) || store.traceId;
    store.method = req.method;
    store.path = req.url;

    const routeObj = req.route as undefined | { path?: string };
    if (routeObj?.path) {
      store.route = routeObj.path;
    } else if (req.baseUrl) {
      store.route = req.baseUrl;
    }

    const reqWithUser = req as Request & { userId?: string };
    if (reqWithUser.userId) {
      store.userId = reqWithUser.userId;
    }
  }

  static populateFromResponse(res: Response): void {
    const store = this.storage.getStore();
    if (!store) {
      return;
    }

    if (!store.status || store.status === 0) {
      store.status = res.statusCode;
    }
  }

  static registerReporter(reporter: TelemetryReporter): void {
    this.reporters.push(reporter);
  }

  static run<T>(traceId: string, callback: () => T): T {
    const store: TelemetryData = {
      ...DEFAULT_TELEMETRY,
      traceId,
    };

    return this.storage.run(store, callback);
  }

  static setError(error: Error | null): void {
    const store = this.storage.getStore();
    if (!store) {
      return;
    }

    store.error = error;
    if (error) {
      store.errorCategory = this.extractErrorCategory(error);
    }
  }

  static setErrorCategory(category: ErrorCategory): void {
    const store = this.storage.getStore();
    if (!store) {
      return;
    }

    store.errorCategory = category;
  }

  static setMethod(method: string): void {
    const store = this.storage.getStore();
    if (!store) {
      return;
    }

    store.method = method;
  }

  static setPath(path: string): void {
    const store = this.storage.getStore();
    if (!store) {
      return;
    }

    store.path = path;
  }

  static setRoute(route: string): void {
    const store = this.storage.getStore();
    if (!store) {
      return;
    }

    store.route = route;
  }

  static setStatus(status: number): void {
    const store = this.storage.getStore();
    if (!store) {
      return;
    }

    store.status = status;
  }

  static setTraceId(traceId: string): void {
    const store = this.storage.getStore();
    if (!store) {
      return;
    }

    store.traceId = traceId;
  }

  static setUserId(userId: string | undefined): void {
    const store = this.storage.getStore();
    if (!store) {
      return;
    }

    store.userId = userId;
  }

  private static reportDegradation(field: RequiredField): void {
    const caller = getCaller();
    const event = {
      caller,
      field,
      stack: new Error().stack,
    };

    for (const reporter of this.reporters) {
      try {
        reporter.reportDegradation(event);
      } catch {
        // Ignore reporter errors to prevent cascading failures
      }
    }
  }
}

function getCaller(): string {
  const err = new Error();
  const stack = err.stack?.split('\n') || [];
  const callerLine = stack[4] || stack[3] || 'unknown';
  const atIndex = callerLine.indexOf('at ');

  if (atIndex !== -1) {
    const afterAt = callerLine.slice(atIndex + 3);
    const parenIndex = afterAt.indexOf(' (');
    if (parenIndex !== -1) {
      return afterAt.slice(0, parenIndex).trim();
    }

    return afterAt.trim();
  }

  return callerLine.trim().replace(/^at /, '');
}

export type { RequiredField, TelemetryData };
