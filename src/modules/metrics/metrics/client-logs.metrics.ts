import { makeCounterProvider, makeGaugeProvider } from '@willsoto/nestjs-prometheus';

export const ClientLogsAcceptedMetric = makeCounterProvider({
  help: 'Total number of accepted log entries',
  labelNames: ['source'],
  name: 'client_logs_accepted_total',
});

export const ClientLogsFailedMetric = makeCounterProvider({
  help: 'Total number of failed log entries',
  labelNames: ['source'],
  name: 'client_logs_failed_total',
});

export const ClientLogsBatchSizeMetric = makeGaugeProvider({
  help: 'Size of the last ingested batch',
  labelNames: ['source'],
  name: 'client_logs_batch_size',
});
