import { Injectable } from '@nestjs/common';

import type { IngestibleLog } from '../interfaces/ingestible-log.interface';

import { MobileLogDto } from '../../../api/client-logs/dtos/mobile-log.dto';
import { LogSource } from '../enums/log-source.enum';

@Injectable()
export class MobileLogNormalizer {
  readonly source = LogSource.MOBILE;

  normalize(dto: MobileLogDto): IngestibleLog {
    return {
      entries: [{ payload: dto.payload, platform: dto.platform }],
      source: this.source,
      timestamp: dto.timestamp,
      traceId: dto.traceId,
    };
  }
}
