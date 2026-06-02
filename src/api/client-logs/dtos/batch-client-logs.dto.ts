import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

import { MobileLogDto } from './mobile-log.dto';
import { WebLogDto } from './web-log.dto';

export const MAX_BATCH_SIZE = 100;

export class BatchClientLogsDto {
  @ApiProperty({ description: 'Batch of mobile client logs', isArray: true, required: false, type: () => MobileLogDto })
  @IsArray()
  mobileLogs?: Record<string, unknown>[];

  @ApiProperty({ description: 'Batch of web client logs', isArray: true, required: false, type: () => WebLogDto })
  @IsArray()
  webLogs?: Record<string, unknown>[];
}
