import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { ApiErrors, ApiPaginated } from '../../common/decorators/swagger.decorators';
import { AuthGuard } from '../../common/guards';
import { InternalServerError } from '../../error-handler/errors/common.errors';
import { UserIsNotAuthorizedError } from '../../error-handler/errors/user.errors';
import { TodoAuditsService } from '../../features/todo-audits/todo-audits.service';
import { TodoAuditsQueryDto } from './dtos/queries/todo-audits-query.dto';
import { TodoAuditResponseDto } from './dtos/responses/todo-audit-response.dto';
import { TodoAuditsResponseDto } from './dtos/responses/todo-audits-response.dto';

@ApiTags('Todo Audits')
@Controller({
  path: 'todo-audits',
  version: '1',
})
export class TodoAuditsController {
  constructor(private readonly todoAuditsService: TodoAuditsService) {}

  @ApiErrors(UserIsNotAuthorizedError, InternalServerError)
  @ApiPaginated(TodoAuditResponseDto, {
    access: true,
    description: 'Query todo audit logs',
    title: 'Find Todo Audits',
  })
  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Query() queryDto: TodoAuditsQueryDto): Promise<TodoAuditsResponseDto> {
    const filter = {
      ...(queryDto.action && { action: queryDto.action }),
      ...(queryDto.operatorId && { operatorId: queryDto.operatorId }),
      ...(queryDto.todoId && { todoId: queryDto.todoId }),
    };

    const pagination = {
      limit: queryDto.limit ?? 10,
      offset: queryDto.offset ?? 1,
    };

    const result = await this.todoAuditsService.findAll(filter, pagination);

    return plainToInstance(TodoAuditsResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }
}
