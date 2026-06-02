import { Injectable } from '@nestjs/common';

import type { RecordAuditInput } from './types/record-audit-input';

import { Prisma } from '../../../database-manager/generated/client';
import { TodoAudit } from '../../../database-manager/generated/client';
import { PrismaService, PrismaTransactionClient } from '../../modules/prisma/prisma.service';
import { PaginatedEntity } from '../../shared/entities/paginated.entity';
import { TodoAuditEntity } from './entities/todo-audit.entity';
import { TodoAuditMapper } from './mappers/todo-audit.mapper';

@Injectable()
export class TodoAuditsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: RecordAuditInput, tx?: PrismaTransactionClient): Promise<TodoAudit> {
    const client = this.getClient(tx);

    return client.todoAudit.create({
      data: {
        action: input.action,
        after: input.after === null ? Prisma.DbNull : input.after,
        before: input.before === null ? Prisma.DbNull : input.before,
        operatorId: input.operatorId,
        todoId: input.todoId,
        traceId: input.traceId,
      },
    });
  }

  async findAll(
    filter: { action?: string; operatorId?: string; todoId?: string },
    pagination: { limit: number; offset: number },
  ): Promise<PaginatedEntity<TodoAuditEntity>> {
    const where = {
      ...(filter.action && { action: filter.action }),
      ...(filter.operatorId && { operatorId: filter.operatorId }),
      ...(filter.todoId && { todoId: filter.todoId }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.todoAudit.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (pagination.offset - 1) * pagination.limit,
        take: pagination.limit,
        where,
      }),
      this.prisma.todoAudit.count({ where }),
    ]);

    return new PaginatedEntity<TodoAuditEntity>({
      items: items.map((item) => TodoAuditMapper.toEntity(item)),
      limit: pagination.limit,
      offset: pagination.offset,
      total,
    });
  }

  private getClient(tx?: PrismaTransactionClient): PrismaService | PrismaTransactionClient {
    return tx ?? this.prisma;
  }
}
