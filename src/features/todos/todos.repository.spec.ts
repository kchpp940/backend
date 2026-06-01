import { Test } from '@nestjs/testing';

import { prismaMock } from '../../mocks/prisma.mock';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { TodoEntity } from './entities/todo.entity';
import { SortOrder, TodoSortField } from './interfaces/queries.enum';
import { TodosRepository } from './todos.repository';

const todoData = { completed: false, description: null, id: 'todo-1', title: 'Test Todo' };

describe('TodosRepository', () => {
  let repository: TodosRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TodosRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get(TodosRepository);

    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('negative cases', () => {
      it('propagates database error', async () => {
        prismaMock.todo.create.mockRejectedValue(new Error('db error'));

        await expect(repository.create('user-1', { title: 'Test' })).rejects.toThrow('db error');
      });
    });

    describe('positive cases', () => {
      it('creates todo with userId merged from dto', async () => {
        prismaMock.todo.create.mockResolvedValue(todoData);

        const result = await repository.create('user-1', { title: 'Test Todo' });

        expect(prismaMock.todo.create).toHaveBeenCalledWith({
          data: { title: 'Test Todo', userId: 'user-1' },
        });
        expect(result).toEqual(todoData);
      });

      it('creates todo with all optional fields', async () => {
        const full = { ...todoData, completed: true, description: 'desc' };
        prismaMock.todo.create.mockResolvedValue(full);

        const result = await repository.create('user-1', {
          completed: true,
          description: 'desc',
          title: 'Test',
        });

        expect(prismaMock.todo.create).toHaveBeenCalledWith({
          data: { completed: true, description: 'desc', title: 'Test', userId: 'user-1' },
        });
        expect(result).toEqual(full);
      });
    });
  });

  describe('findAll', () => {
    const sort = { order: SortOrder.DESC, sortBy: TodoSortField.TITLE };
    const filter = {};
    const pagination = { limit: 10, offset: 1 };

    describe('negative cases', () => {
      it('uses empty orderBy when sortBy is falsy', async () => {
        prismaMock.$transaction.mockResolvedValue([[], 0]);

        await repository.findAll('user-1', filter, { order: SortOrder.DESC, sortBy: undefined as never }, pagination);

        expect(prismaMock.todo.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: {} }));
      });
    });

    describe('positive cases', () => {
      it('returns paginated entity with mapped todos', async () => {
        prismaMock.$transaction.mockResolvedValue([[todoData], 1]);

        const result = await repository.findAll('user-1', filter, sort, pagination);

        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toBeInstanceOf(TodoEntity);
        expect(result.data[0].id).toBe('todo-1');
        expect(result.meta).toEqual({ limit: 10, offset: 1, total: 1 });
      });

      it('queries with correct where clause including userId and filter', async () => {
        prismaMock.$transaction.mockResolvedValue([[], 0]);

        await repository.findAll('user-1', { completed: true }, sort, pagination);

        expect(prismaMock.todo.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { completed: true, userId: 'user-1' } }),
        );
        expect(prismaMock.todo.count).toHaveBeenCalledWith({
          where: { completed: true, userId: 'user-1' },
        });
      });

      it('applies correct orderBy from sort query', async () => {
        prismaMock.$transaction.mockResolvedValue([[], 0]);

        await repository.findAll(
          'user-1',
          filter,
          { order: SortOrder.ASC, sortBy: TodoSortField.CREATED_AT },
          pagination,
        );

        expect(prismaMock.todo.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ orderBy: { createdAt: SortOrder.ASC } }),
        );
      });

      it('calculates correct skip from offset', async () => {
        prismaMock.$transaction.mockResolvedValue([[], 0]);

        await repository.findAll('user-1', filter, sort, { limit: 10, offset: 3 });

        expect(prismaMock.todo.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 10 }));
      });

      it('returns empty data when no todos match', async () => {
        prismaMock.$transaction.mockResolvedValue([[], 0]);

        const result = await repository.findAll('user-1', filter, sort, pagination);

        expect(result.data).toHaveLength(0);
        expect(result.meta.total).toBe(0);
      });

      it('maps multiple todos to entities', async () => {
        const second = { completed: true, description: 'desc', id: 'todo-2', title: 'Second' };
        prismaMock.$transaction.mockResolvedValue([[todoData, second], 2]);

        const result = await repository.findAll('user-1', filter, sort, pagination);

        expect(result.data).toHaveLength(2);
        expect(result.data[1].description).toBe('desc');
      });
    });
  });

  describe('findOne', () => {
    describe('negative cases', () => {
      it('returns void when todo does not exist', async () => {
        prismaMock.todo.findFirst.mockResolvedValue(null);

        const result = await repository.findOne('missing-id', 'user-1');

        expect(result).toBeUndefined();
      });

      it('returns void when todo belongs to another user', async () => {
        prismaMock.todo.findFirst.mockResolvedValue(null);

        const result = await repository.findOne('todo-1', 'other-user');

        expect(result).toBeUndefined();
      });
    });

    describe('positive cases', () => {
      it('returns TodoEntity when todo exists', async () => {
        prismaMock.todo.findFirst.mockResolvedValue(todoData);

        const result = await repository.findOne('todo-1', 'user-1');

        expect(result).toBeInstanceOf(TodoEntity);
        expect(result?.id).toBe('todo-1');
      });

      it('queries by id and userId', async () => {
        prismaMock.todo.findFirst.mockResolvedValue(todoData);

        await repository.findOne('todo-1', 'user-1');

        expect(prismaMock.todo.findFirst).toHaveBeenCalledWith({ where: { id: 'todo-1', userId: 'user-1' } });
      });

      it('maps all fields to entity', async () => {
        const full = { completed: true, description: 'desc', id: 'todo-1', title: 'Title' };
        prismaMock.todo.findFirst.mockResolvedValue(full);

        const result = await repository.findOne('todo-1', 'user-1');

        expect(result?.completed).toBe(true);
        expect(result?.description).toBe('desc');
      });
    });
  });

  describe('remove', () => {
    describe('negative cases', () => {
      it('returns false when todo does not exist', async () => {
        prismaMock.todo.deleteMany.mockResolvedValue({ count: 0 });

        const result = await repository.remove('missing-id', 'user-1');

        expect(result).toBe(false);
      });

      it('returns false when todo belongs to another user', async () => {
        prismaMock.todo.deleteMany.mockResolvedValue({ count: 0 });

        const result = await repository.remove('todo-1', 'other-user');

        expect(result).toBe(false);
      });

      it('propagates database error on delete', async () => {
        prismaMock.todo.deleteMany.mockRejectedValue(new Error('db error'));

        await expect(repository.remove('todo-1', 'user-1')).rejects.toThrow('db error');
      });
    });

    describe('positive cases', () => {
      it('returns true and calls deleteMany with id and userId', async () => {
        prismaMock.todo.deleteMany.mockResolvedValue({ count: 1 });

        const result = await repository.remove('todo-1', 'user-1');

        expect(result).toBe(true);
        expect(prismaMock.todo.deleteMany).toHaveBeenCalledWith({
          where: { id: 'todo-1', userId: 'user-1' },
        });
      });
    });
  });

  describe('update', () => {
    describe('negative cases', () => {
      it('returns void when updateMany matches 0 rows', async () => {
        prismaMock.todo.updateMany.mockResolvedValue({ count: 0 });

        const result = await repository.update('todo-1', 'user-1', { title: 'New' });

        expect(result).toBeUndefined();
      });

      it('returns void when todo belongs to another user', async () => {
        prismaMock.todo.updateMany.mockResolvedValue({ count: 0 });

        const result = await repository.update('todo-1', 'other-user', { title: 'New' });

        expect(result).toBeUndefined();
      });

      it('returns void when updateMany matches but findUnique returns null (race condition)', async () => {
        prismaMock.todo.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.todo.findUnique.mockResolvedValue(null);

        const result = await repository.update('todo-1', 'user-1', { title: 'New' });

        expect(result).toBeUndefined();
      });

      it('propagates database error', async () => {
        prismaMock.todo.updateMany.mockRejectedValue(new Error('db error'));

        await expect(repository.update('todo-1', 'user-1', { title: 'New' })).rejects.toThrow('db error');
      });
    });

    describe('positive cases', () => {
      it('updates and returns mapped entity', async () => {
        const updated = { ...todoData, title: 'Updated' };
        prismaMock.todo.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.todo.findUnique.mockResolvedValue(updated);

        const result = await repository.update('todo-1', 'user-1', { title: 'Updated' });

        expect(result).toBeInstanceOf(TodoEntity);
        expect(result?.title).toBe('Updated');
      });

      it('calls prisma updateMany with correct args', async () => {
        prismaMock.todo.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.todo.findUnique.mockResolvedValue(todoData);

        await repository.update('todo-1', 'user-1', { completed: true, title: 'New' });

        expect(prismaMock.todo.updateMany).toHaveBeenCalledWith({
          data: { completed: true, title: 'New' },
          where: { id: 'todo-1', userId: 'user-1' },
        });
      });
    });
  });
});
