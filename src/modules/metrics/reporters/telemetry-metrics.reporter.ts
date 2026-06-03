import { Injectable, OnModuleInit } from '@nestjs/common';
import { Counter } from 'prom-client';

import type { TelemetryDegradationEvent, TelemetryReporter } from '../../../logger/context/telemetry-reporter.types';

import { RequestTelemetryContext } from '../../../logger/context/request-telemetry.context';

@Injectable()
export class TelemetryMetricsReporter implements OnModuleInit, TelemetryReporter {
  private readonly degradationCounter: Counter<string>;

  constructor() {
    this.degradationCounter = new Counter({
      help: 'Total number of telemetry context accesses outside request scope',
      labelNames: ['field', 'caller'],
      name: 'telemetry_degradation_total',
    });
  }

  onModuleInit(): void {
    RequestTelemetryContext.registerReporter(this);
  }

  reportDegradation(event: TelemetryDegradationEvent): void {
    this.degradationCounter.labels(event.field, event.caller).inc();
  }
}
