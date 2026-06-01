import { Test } from '@nestjs/testing';

import type { TodosQueryDto } from '../../api/todos/dtos/queries/todos-query.dto';

import { cacheStorageMock } from '../../mocks/cache-storage.mock';
import { CacheStorage } from '../../modules/redis-manager/storages/cache.storage';
import { PaginatedEntity } from '../../shared/entities/paginated.entity';
import { TodoEntity } from './entities/todo.entity';
import { TodosCacheService } from './todos.cache.service';

const todoData = new TodoEntity({
  completed: false,
  description: null,
  id: 'todo-1',
  title: 'Test Todo',
});

describe('TodosCacheService', () => {
  let service: TodosCacheService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TodosCacheService, { provide: CacheStorage, useValue: cacheStorageMock }],
    }).compile();

    service = module.get(TodosCacheService);

    jest.clearAllMocks();
  });

  describe('getTodo', () => {
    describe('positive cases', () => {
      it('reads from cache using user-scoped key', async () => {
        cacheStorageMock.get.mockResolvedValue(todoData);

        const result = await service.getTodo('user-1', 'todo-1');

        expect(result).toBe(todoData);
        expect(cacheStorageMock.get).toHaveBeenCalledWith('todo:user-1:todo-1');
      });

      it('returns null when cache is empty', async () => {
        cacheStorageMock.get.mockResolvedValue(null);

        const result = await service.getTodo('user-1', 'todo-1');

        expect(result).toBeNull();
      });
    });
  });

  describe('setTodo', () => {
    describe('positive cases', () => {
      it('writes to cache with user-scoped key and 60s TTL', async () => {
        await service.setTodo('user-1', 'todo-1', todoData);

        expect(cacheStorageMock.set).toHaveBeenCalledWith('todo:user-1:todo-1', todoData, 60);
      });
    });
  });

  describe('getTodos', () => {
    describe('positive cases', () => {
      it('reads from cache using user and query scoped key', async () => {
        const cached = new PaginatedEntity({ items: [todoData], limit: 10, offset: 1, total: 1 });
        cacheStorageMock.get.mockResolvedValue(cached);

        const query: TodosQueryDto = { limit: 10 };
        const result = await service.getTodos('user-1', query);

        expect(result).toBe(cached);
        expect(cacheStorageMock.get).toHaveBeenCalledWith(expect.stringMatching(/^todos:user-1:/));
      });
    });
  });

  describe('setTodos', () => {
    describe('positive cases', () => {
      it('writes paginated result with 30s TTL', async () => {
        const result = new PaginatedEntity({ items: [todoData], limit: 10, offset: 1, total: 1 });
        const query: TodosQueryDto = { limit: 10 };

        await service.setTodos('user-1', query, result);

        expect(cacheStorageMock.set).toHaveBeenCalledWith(expect.stringMatching(/^todos:user-1:/), result, 30);
      });
    });
  });

  describe('invalidateTodo', () => {
    describe('positive cases', () => {
      it('deletes the user-scoped detail cache key', async () => {
        await service.invalidateTodo('user-1', 'todo-1');

        expect(cacheStorageMock.del).toHaveBeenCalledWith('todo:user-1:todo-1');
      });
    });
  });

  describe('invalidateTodosByUser', () => {
    describe('positive cases', () => {
      it('deletes all list cache entries for the user', async () => {
        await service.invalidateTodosByUser('user-1');

        expect(cacheStorageMock.delByPattern).toHaveBeenCalledWith('todos:user-1:*');
      });
    });
  });

  describe('invalidateAllForUser', () => {
    describe('positive cases', () => {
      it('invalidates both detail and list caches when id is provided', async () => {
        await service.invalidateAllForUser('user-1', 'todo-1');

        expect(cacheStorageMock.del).toHaveBeenCalledWith('todo:user-1:todo-1');
        expect(cacheStorageMock.delByPattern).toHaveBeenCalledWith('todos:user-1:*');
      });

      it('invalidates only list caches when id is omitted', async () => {
        await service.invalidateAllForUser('user-1');

        expect(cacheStorageMock.del).not.toHaveBeenCalled();
        expect(cacheStorageMock.delByPattern).toHaveBeenCalledWith('todos:user-1:*');
      });
    });
  });
});
