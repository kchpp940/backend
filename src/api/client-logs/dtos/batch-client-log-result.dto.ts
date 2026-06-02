import { ApiProperty } from '@nestjs/swagger';

export enum BatchLogItemStatus {
  ACCEPTED = 'accepted',
  FAILED = 'failed',
}

export enum BatchLogType {
  MOBILE = 'mobile',
  WEB = 'web',
}

export class BatchClientLogResultDto {
  @ApiProperty({ description: 'Error message when processing failed', required: false })
  error?: string;

  @ApiProperty({ description: 'Index of the item within its log type array', example: 0 })
  index: number;

  @ApiProperty({ enum: BatchLogItemStatus, example: BatchLogItemStatus.ACCEPTED })
  status: BatchLogItemStatus;

  @ApiProperty({
    description: 'Trace ID of the log item; absent when the item failed validation',
    example: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
    required: false,
  })
  traceId?: string;

  @ApiProperty({ enum: BatchLogType, example: BatchLogType.WEB })
  type: BatchLogType;
}

export class BatchClientLogsResponseDto {
  @ApiProperty({ description: 'Number of successfully accepted logs', example: 3 })
  accepted: number;

  @ApiProperty({ description: 'Number of failed logs', example: 1 })
  failed: number;

  @ApiProperty({ description: 'Per-item processing results', isArray: true, type: () => BatchClientLogResultDto })
  results: BatchClientLogResultDto[];

  @ApiProperty({ description: 'Total number of logs in the batch', example: 4 })
  total: number;
}
