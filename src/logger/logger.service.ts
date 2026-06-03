import type { ConfigType } from '@nestjs/config';

import { Inject, Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import pino, { LogDescriptor, Logger } from 'pino';
import pretty from 'pino-pretty';

import { logConfig } from '../config/log.config';
import { ErrorCategory } from '../error-handler/constants/error-category';
import { EnvironmentService } from '../modules/environment/environment.service';
import { RequestTelemetryContext } from './context/request-telemetry.context';

type Details = unknown;

interface Message {
  code?: string;
  ctx: string;
  details?: Details;
  errorCategory?: ErrorCategory;
  method?: string;
  msg: string;
  path?: string;
  route?: string;
  stack?: string;
  traceId?: string;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  #appName = 'Company App';

  private readonly logger: Logger;

  constructor(
    @Inject(logConfig.KEY)
    private readonly config: ConfigType<typeof logConfig>,
    private readonly environment: EnvironmentService,
  ) {
    const stream = config.logPretty
      ? pretty({
          colorize: true,

          ignore: 'appName,ctx,env,traceId,levelName',
          messageFormat: (log: LogDescriptor, messageKey: string) => {
            const ctx = log.ctx ? `[${log.ctx}]` : '';
            const level = (log.levelLabel as string) ?? log.level;
            const traceId = log.traceId === '' ? '' : `Trace-ID: ${log.traceId}`;

            return `${level} ${ctx} ${traceId} ${log[messageKey]}`;
          },

          translateTime: 'dd/mm/yyyy, HH:MM:ss',
        })
      : undefined;

    this.logger = pino(
      {
        base: {
          env: environment.getEnv(),
        },
        level: config.logLevel,
        redact: {
          censor: '[REDACTED]',
          paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
        },
        timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
      },
      stream,
    );
  }

  debug(message: Message): void {
    const telemetry = RequestTelemetryContext.getRequiredAll();
    this.logger.debug({
      appName: this.#appName,
      errorCategory: message.errorCategory || telemetry.errorCategory,
      levelName: 'debug',
      method: message.method || telemetry.method,
      path: message.path || telemetry.path,
      pid: process.pid,
      route: message.route || telemetry.route,
      traceId: message.traceId || telemetry.traceId,
      ...(typeof message === 'string' ? { msg: message } : message),
    });
  }

  error(message: Message): void {
    const telemetry = RequestTelemetryContext.getRequiredAll();
    this.logger.error({
      appName: this.#appName,
      errorCategory: message.errorCategory || telemetry.errorCategory,
      levelName: 'error',
      method: message.method || telemetry.method,
      path: message.path || telemetry.path,
      pid: process.pid,
      route: message.route || telemetry.route,
      traceId: message.traceId || telemetry.traceId,
      ...(typeof message === 'string' ? { msg: message } : message),
    });
  }

  log(message: Message): void {
    const telemetry = RequestTelemetryContext.getRequiredAll();
    this.logger.info({
      appName: this.#appName,
      errorCategory: message.errorCategory || telemetry.errorCategory,
      levelName: 'info',
      method: message.method || telemetry.method,
      path: message.path || telemetry.path,
      pid: process.pid,
      route: message.route || telemetry.route,
      traceId: message.traceId || telemetry.traceId,
      ...(typeof message === 'string' ? { msg: message } : message),
    });
  }

  public setAppName(name: string): void {
    this.#appName = name;
  }

  warn(message: Message): void {
    const telemetry = RequestTelemetryContext.getRequiredAll();
    this.logger.warn({
      appName: this.#appName,
      errorCategory: message.errorCategory || telemetry.errorCategory,
      levelName: 'warn',
      method: message.method || telemetry.method,
      path: message.path || telemetry.path,
      pid: process.pid,
      route: message.route || telemetry.route,
      traceId: message.traceId || telemetry.traceId,
      ...(typeof message === 'string' ? { msg: message } : message),
    });
  }
}
