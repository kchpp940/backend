import { RequestTelemetryContext } from './request-telemetry.context';

/**
 * @deprecated Use RequestTelemetryContext instead for unified telemetry data
 * This class is kept for backward compatibility
 */
class RequestContext {
  static getTraceId(): string {
    return RequestTelemetryContext.getTraceId();
  }

  static run(traceId: string, callback: () => void): void {
    RequestTelemetryContext.run(traceId, callback);
  }
}

export { RequestContext };
