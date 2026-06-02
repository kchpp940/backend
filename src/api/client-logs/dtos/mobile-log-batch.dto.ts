import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';

import { MobileLogDto } from './mobile-log.dto';

export class MobileLogBatchDto {
  @ApiProperty({ isArray: true, type: () => MobileLogDto })
  @ArrayNotEmpty()
  @IsArray()
  @Type(() => MobileLogDto)
  @ValidateNested({ each: true })
  logs: MobileLogDto[];
}
