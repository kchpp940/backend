import { Injectable } from '@nestjs/common';

import type { IngestibleLog } from '../interfaces/ingestible-log.interface';

import { WebLogDto } from '../../../api/client-logs/dtos/web-log.dto';
import { LogSource } from '../enums/log-source.enum';

@Injectable()
export class WebLogNormalizer {
  readonly source = LogSource.WEB;

  normalize(dto: WebLogDto): IngestibleLog {
    return {
      entries: dto.actions.map((action) => ({
        ctx: action.ctx,
        env: dto.env,
        level: action.level,
        message: action.message,
        metadata: dto.metadata,
        payload: action.payload,
      })),
      source: this.source,
      timestamp: dto.timestamp,
      traceId: dto.traceId,
    };
  }
}
