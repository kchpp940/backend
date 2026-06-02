import type { TodosQueryParams } from './todos.cache-queries';

import { SortOrder, TodoSortField } from '../interfaces/queries.enum';
import { TodosCacheKeys } from './todos.cache-queries';

const createTestParams = (overrides: Partial<TodosQueryParams> = {}): TodosQueryParams => ({
  filter: {},
  pagination: { limit: 10, offset: 1 },
  sort: { order: SortOrder.DESC, sortBy: TodoSortField.TITLE },
  ...overrides,
});

describe('TodosCacheKeys', () => {
  describe('todo', () => {
    describe('positive cases', () => {
      it('returns a key prefixed with "todo:"', () => {
        expect(TodosCacheKeys.todo('abc-123')).toBe('todo:abc-123');
      });

      it('returns unique keys for different ids', () => {
        expect(TodosCacheKeys.todo('id-1')).not.toBe(TodosCacheKeys.todo('id-2'));
      });
    });
  });

  describe('todos', () => {
    describe('positive cases', () => {
      it('returns a key prefixed with "todos:<userId>:"', () => {
        const params = createTestParams();
        const key = TodosCacheKeys.todos('user-1', params);

        expect(key).toMatch(/^todos:user-1:/);
      });

      it('encodes query params as base64', () => {
        const params = createTestParams();
        const key = TodosCacheKeys.todos('user-1', params);
        const encoded = key.split(':').at(-1)!;
        const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString()) as Record<string, string>;

        expect(decoded).toEqual(params);
      });

      it('returns different keys for different pagination', () => {
        const params1 = createTestParams({ pagination: { limit: 10, offset: 1 } });
        const params2 = createTestParams({ pagination: { limit: 20, offset: 1 } });

        expect(TodosCacheKeys.todos('user-1', params1)).not.toBe(TodosCacheKeys.todos('user-1', params2));
      });

      it('returns different keys for different filters', () => {
        const params1 = createTestParams({ filter: { completed: true } });
        const params2 = createTestParams({ filter: { completed: false } });

        expect(TodosCacheKeys.todos('user-1', params1)).not.toBe(TodosCacheKeys.todos('user-1', params2));
      });

      it('returns different keys for different users with same params', () => {
        const params = createTestParams();
        const key1 = TodosCacheKeys.todos('user-1', params);
        const key2 = TodosCacheKeys.todos('user-2', params);

        expect(key1).not.toBe(key2);
      });

      it('returns same key for identical userId and params', () => {
        const params = createTestParams();

        expect(TodosCacheKeys.todos('user-1', params)).toBe(TodosCacheKeys.todos('user-1', params));
      });
    });
  });

  describe('todosByUser', () => {
    describe('positive cases', () => {
      it('returns a wildcard pattern for the user', () => {
        expect(TodosCacheKeys.todosByUser('user-1')).toBe('todos:user-1:*');
      });

      it('returns different patterns for different users', () => {
        expect(TodosCacheKeys.todosByUser('user-1')).not.toBe(TodosCacheKeys.todosByUser('user-2'));
      });
    });
  });
});
