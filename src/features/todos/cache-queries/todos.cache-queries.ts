import type { TodoFilter, TodoPagination, TodoSort } from '../types/todo.query';

export interface TodosQueryParams {
  filter: TodoFilter;
  pagination: TodoPagination;
  sort: TodoSort;
}

export class TodosCacheKeys {
  static todo(id: string): string {
    return `todo:${id}`;
  }

  static todos(userId: string, params: TodosQueryParams): string {
    return `todos:${userId}:${Buffer.from(JSON.stringify(params)).toString('base64')}`;
  }

  static todosByUser(userId: string): string {
    return `todos:${userId}:*`;
  }
}
