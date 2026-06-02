export class TodoAuditEntity {
  action: string;
  after: unknown;
  before: unknown;
  createdAt: Date;
  id: string;
  operatorId: string;
  todoId: string;
  traceId: string;

  constructor(partial: Partial<TodoAuditEntity>) {
    Object.assign(this, partial);
  }
}
