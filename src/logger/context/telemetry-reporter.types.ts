import type { RequiredField } from './request-telemetry.context';

interface TelemetryDegradationEvent {
  caller: string;
  field: RequiredField;
  stack?: string;
}

interface TelemetryReporter {
  reportDegradation(event: TelemetryDegradationEvent): void;
}

export type { TelemetryDegradationEvent, TelemetryReporter };
