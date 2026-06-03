import { Injectable, OnModuleInit } from '@nestjs/common';
import pino from 'pino';

import type { TelemetryDegradationEvent, TelemetryReporter } from '../context/telemetry-reporter.types';

import { RequestTelemetryContext } from '../context/request-telemetry.context';

@Injectable()
export class TelemetryLogReporter implements OnModuleInit, TelemetryReporter {
  private readonly logger: pino.Logger;

  constructor() {
    this.logger = pino({
      base: undefined,
      level: 'warn',
      name: 'telemetry-degradation',
      redact: {
        censor: '[REDACTED]',
        paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
      },
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    });
  }

  onModuleInit(): void {
    RequestTelemetryContext.registerReporter(this);
  }

  reportDegradation(event: TelemetryDegradationEvent): void {
    this.logger.warn({
      caller: event.caller,
      ctx: 'RequestTelemetryContext',
      field: event.field,
      msg: `Telemetry context missing for '${event.field}', falling back to default values`,
      stack: event.stack,
    });
  }
}
