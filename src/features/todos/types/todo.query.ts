import type { Prisma } from '../../../../database-manager/generated/client';
import type { SortOrder, TodoSearchField, TodoSortField } from '../interfaces/queries.enum';

export type TodoFilter = Pick<Prisma.TodoWhereInput, 'completed' | 'description' | 'dueDate' | 'priority' | 'title'>;

export interface TodoPagination {
  limit: number;
  offset: number;
}

export type TodoSearchableField = keyof Pick<TodoFilter, 'description' | 'title'>;

export interface TodoSort {
  order: SortOrder;
  sortBy: TodoSortField;
}

void null as unknown as (typeof TodoSearchField)[keyof typeof TodoSearchField] extends TodoSearchableField
  ? true
  : never;
