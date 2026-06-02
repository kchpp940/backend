import type { Todo } from '../../../../database-manager/generated/client';

import { TodoEntity } from '../entities/todo.entity';
import { TodoPriority } from '../interfaces/queries.enum';

type TodoWithUser = Todo & { user?: { name: string } };

const PRISMA_TO_APP_PRIORITY: Record<string, TodoPriority> = {
  HIGH: TodoPriority.HIGH,
  LOW: TodoPriority.LOW,
  MEDIUM: TodoPriority.MEDIUM,
} as const;

export class TodoMapper {
  static toEntity(todo: TodoWithUser): TodoEntity {
    const priority = PRISMA_TO_APP_PRIORITY[todo.priority] ?? TodoPriority.MEDIUM;

    return new TodoEntity({
      completed: todo.completed,
      description: todo.description,
      dueDate: todo.dueDate,
      id: todo.id,
      priority,
      title: todo.title,
      userName: todo.user?.name,
    });
  }
}
