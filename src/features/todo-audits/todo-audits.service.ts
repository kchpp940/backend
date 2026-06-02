import { Injectable } from '@nestjs/common';

import type { RecordAuditInput } from './types/record-audit-input';

import { PrismaTransactionClient } from '../../modules/prisma/prisma.service';
import { PaginatedEntity } from '../../shared/entities/paginated.entity';
import { TodoAuditEntity } from './entities/todo-audit.entity';
import { TodoAuditsRepository } from './todo-audits.repository';

@Injectable()
export class TodoAuditsService {
  constructor(private readonly todoAuditsRepository: TodoAuditsRepository) {}

  buildAuditInput(params: {
    action: string;
    after?: unknown;
    before?: unknown;
    operatorId: string;
    todoId: string;
    traceId: string;
  }): RecordAuditInput {
    return {
      action: params.action,
      after: params.after ?? null,
      before: params.before ?? null,
      operatorId: params.operatorId,
      todoId: params.todoId,
      traceId: params.traceId,
    };
  }

  async findAll(
    filter: { action?: string; operatorId?: string; todoId?: string },
    pagination: { limit: number; offset: number },
  ): Promise<PaginatedEntity<TodoAuditEntity>> {
    return this.todoAuditsRepository.findAll(filter, pagination);
  }

  async recordAudit(input: RecordAuditInput, tx?: PrismaTransactionClient): Promise<void> {
    await this.todoAuditsRepository.create(input, tx);
  }
}
