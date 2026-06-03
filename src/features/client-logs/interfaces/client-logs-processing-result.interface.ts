import type { IngestionEntryResult } from '../log-ingestion-pipeline';

export interface ClientLogsProcessingResult {
  accepted: number;
  failed: number;
  results: IngestionEntryResult[];
}
