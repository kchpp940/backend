export interface RecordAuditInput {
  action: string;
  after?: unknown;
  before?: unknown;
  operatorId: string;
  todoId: string;
  traceId: string;
}
