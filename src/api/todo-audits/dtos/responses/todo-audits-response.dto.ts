import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { PaginationMetaDto } from '../../../../shared/dtos/pagination.dto';
import { TodoAuditResponseDto } from './todo-audit-response.dto';

export class TodoAuditsResponseDto {
  @ApiProperty({ type: [TodoAuditResponseDto] })
  @Expose()
  @Type(() => TodoAuditResponseDto)
  data: TodoAuditResponseDto[];

  @ApiProperty()
  @Expose()
  meta: PaginationMetaDto;
}
