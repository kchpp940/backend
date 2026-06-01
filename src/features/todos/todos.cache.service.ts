import { Injectable } from '@nestjs/common';

import type { TodosQueryDto } from '../../api/todos/dtos/queries/todos-query.dto';

import { CacheStorage } from '../../modules/redis-manager/storages/cache.storage';
import { PaginatedEntity } from '../../shared/entities/paginated.entity';
import { TodosCacheKeys } from './cache-queries/todos.cache-queries';
import { TodoEntity } from './entities/todo.entity';

@Injectable()
export class TodosCacheService {
  constructor(private readonly cacheStorage: CacheStorage) {}

  async getTodo(userId: string, id: string): Promise<null | TodoEntity> {
    const key = TodosCacheKeys.todo(userId, id);

    return this.cacheStorage.get<TodoEntity>(key);
  }

  async getTodos(userId: string, query: TodosQueryDto): Promise<null | PaginatedEntity<TodoEntity>> {
    const key = TodosCacheKeys.todos(userId, query);

    return this.cacheStorage.get<PaginatedEntity<TodoEntity>>(key);
  }

  async invalidateAllForUser(userId: string, id?: string): Promise<void> {
    if (id) {
      await this.invalidateTodo(userId, id);
    }
    await this.invalidateTodosByUser(userId);
  }

  async invalidateTodo(userId: string, id: string): Promise<void> {
    const key = TodosCacheKeys.todo(userId, id);
    await this.cacheStorage.del(key);
  }

  async invalidateTodosByUser(userId: string): Promise<void> {
    const pattern = TodosCacheKeys.todosByUser(userId);
    await this.cacheStorage.delByPattern(pattern);
  }

  async setTodo(userId: string, id: string, todo: TodoEntity): Promise<void> {
    const key = TodosCacheKeys.todo(userId, id);
    await this.cacheStorage.set(key, todo, 60);
  }

  async setTodos(userId: string, query: TodosQueryDto, result: PaginatedEntity<TodoEntity>): Promise<void> {
    const key = TodosCacheKeys.todos(userId, query);
    await this.cacheStorage.set(key, result, 30);
  }
}
