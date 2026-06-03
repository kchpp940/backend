---
name: project-client-logs
description: ClientLogsModule — pipeline-based web/mobile log ingestion with LogWriter + MetricsService
metadata:
  type: project
---

`PinoLogWriter` currently writes to pino via `LoggerService`. S3 upload is planned but not yet implemented.

**Why:** S3 upload logic is planned but not yet implemented.

**How to apply:** Create a new `LogWriter` implementation (e.g. `S3LogWriter`) and swap the `LOG_WRITER` provider in `ClientLogsModule`.

## Architecture

```
Controller → ClientLogsService → Normalizer → LogIngestionPipeline → LogWriter.write()
                                                              ↓
                                        MetricsService.record*()  (service layer)
                                                              ↓
                                        LoggerService.error()   (pipeline layer, on failure)
```

### Responsibility breakdown

| Component              | Responsibility                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `LogIngestionPipeline` | Per-entry write + error isolation, returns `IngestionResult` with `accepted/failed/results/total`           |
| `MetricsService`       | All metrics recording (`recordClientLogsAccepted` / `recordClientLogsFailed` / `recordClientLogsBatchSize`) |
| `ClientLogsService`    | Orchestrator: normalize → pipeline → record metrics → return result                                         |
| `LogWriter`            | Pluggable write target (pino today, S3 tomorrow)                                                            |

New source types only need a new `LogSource` enum member and a corresponding normalizer that maps their DTO to `IngestibleLog`.
