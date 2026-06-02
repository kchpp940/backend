import type { TodoPriority } from '../interfaces/queries.enum';

export class TodoEntity {
  completed: boolean;
  description: null | string;
  dueDate: Date | null;
  id: string;
  priority: TodoPriority;
  title: string;
  userName?: string;

  constructor(partial: Partial<TodoEntity>) {
    Object.assign(this, partial);
  }
}
