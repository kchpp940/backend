import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';

import { WebLogDto } from './web-log.dto';

export class WebLogBatchDto {
  @ApiProperty({ isArray: true, type: () => WebLogDto })
  @ArrayNotEmpty()
  @IsArray()
  @Type(() => WebLogDto)
  @ValidateNested({ each: true })
  logs: WebLogDto[];
}
