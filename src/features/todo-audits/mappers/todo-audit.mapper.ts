import type { TodoAudit } from '../../../../database-manager/generated/client';

import { TodoAuditEntity } from '../entities/todo-audit.entity';

export class TodoAuditMapper {
  static toEntity(audit: TodoAudit): TodoAuditEntity {
    return new TodoAuditEntity({
      action: audit.action,
      after: audit.after,
      before: audit.before,
      createdAt: audit.createdAt,
      id: audit.id,
      operatorId: audit.operatorId,
      todoId: audit.todoId,
      traceId: audit.traceId,
    });
  }
}
