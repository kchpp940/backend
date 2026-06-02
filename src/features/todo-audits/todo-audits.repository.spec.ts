import { Test } from '@nestjs/testing';

import { Prisma } from '../../../database-manager/generated/client';
import { prismaMock, resetPrismaTransactionMock } from '../../mocks/prisma.mock';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { TodoAuditEntity } from './entities/todo-audit.entity';
import { TodoAuditsRepository } from './todo-audits.repository';

const auditData = {
  action: 'CREATE',
  after: { completed: false, description: null, id: 'todo-1', title: 'Test' },
  before: null,
  createdAt: new Date(),
  id: 'audit-1',
  operatorId: 'user-1',
  todoId: 'todo-1',
  traceId: 'trace-123',
};

describe('TodoAuditsRepository', () => {
  let repository: TodoAuditsRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TodoAuditsRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get(TodoAuditsRepository);

    jest.clearAllMocks();
    resetPrismaTransactionMock();
  });

  describe('create', () => {
    describe('positive cases', () => {
      it('creates audit record with all fields', async () => {
        prismaMock.todoAudit.create.mockResolvedValue(auditData);

        const result = await repository.create({
          action: 'CREATE',
          after: { completed: false, id: 'todo-1', title: 'Test' },
          before: null,
          operatorId: 'user-1',
          todoId: 'todo-1',
          traceId: 'trace-123',
        });

        expect(prismaMock.todoAudit.create).toHaveBeenCalledWith({
          data: {
            action: 'CREATE',
            after: { completed: false, id: 'todo-1', title: 'Test' },
            before: Prisma.DbNull,
            operatorId: 'user-1',
            todoId: 'todo-1',
            traceId: 'trace-123',
          },
        });
        expect(result).toEqual(auditData);
      });

      it('creates audit record with before and after', async () => {
        const data = {
          ...auditData,
          action: 'UPDATE',
          after: { completed: true, id: 'todo-1', title: 'Updated' },
          before: { completed: false, id: 'todo-1', title: 'Test' },
        };
        prismaMock.todoAudit.create.mockResolvedValue(data);

        const result = await repository.create({
          action: 'UPDATE',
          after: { completed: true, id: 'todo-1', title: 'Updated' },
          before: { completed: false, id: 'todo-1', title: 'Test' },
          operatorId: 'user-1',
          todoId: 'todo-1',
          traceId: 'trace-123',
        });

        expect(prismaMock.todoAudit.create).toHaveBeenCalledWith({
          data: {
            action: 'UPDATE',
            after: { completed: true, id: 'todo-1', title: 'Updated' },
            before: { completed: false, id: 'todo-1', title: 'Test' },
            operatorId: 'user-1',
            todoId: 'todo-1',
            traceId: 'trace-123',
          },
        });
        expect(result.action).toBe('UPDATE');
      });
    });

    describe('negative cases', () => {
      it('propagates database error', async () => {
        prismaMock.todoAudit.create.mockRejectedValue(new Error('db error'));

        await expect(
          repository.create({
            action: 'CREATE',
            operatorId: 'user-1',
            todoId: 'todo-1',
            traceId: 'trace-123',
          }),
        ).rejects.toThrow('db error');
      });
    });
  });

  describe('findAll', () => {
    describe('positive cases', () => {
      it('returns paginated audit entities', async () => {
        prismaMock.$transaction.mockResolvedValue([[auditData], 1]);

        const result = await repository.findAll({}, { limit: 10, offset: 1 });

        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toBeInstanceOf(TodoAuditEntity);
        expect(result.data[0].id).toBe('audit-1');
        expect(result.meta).toEqual({ limit: 10, offset: 1, total: 1 });
      });

      it('queries with filter when todoId is provided', async () => {
        prismaMock.$transaction.mockResolvedValue([[auditData], 1]);

        await repository.findAll({ todoId: 'todo-1' }, { limit: 10, offset: 1 });

        expect(prismaMock.todoAudit.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { todoId: 'todo-1' } }),
        );
      });

      it('queries with filter when action is provided', async () => {
        prismaMock.$transaction.mockResolvedValue([[auditData], 1]);

        await repository.findAll({ action: 'CREATE' }, { limit: 10, offset: 1 });

        expect(prismaMock.todoAudit.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { action: 'CREATE' } }),
        );
      });

      it('queries with combined filters', async () => {
        prismaMock.$transaction.mockResolvedValue([[auditData], 1]);

        await repository.findAll(
          { action: 'UPDATE', operatorId: 'user-1', todoId: 'todo-1' },
          { limit: 10, offset: 1 },
        );

        expect(prismaMock.todoAudit.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { action: 'UPDATE', operatorId: 'user-1', todoId: 'todo-1' },
          }),
        );
      });

      it('returns empty data when no audits match', async () => {
        prismaMock.$transaction.mockResolvedValue([[], 0]);

        const result = await repository.findAll({}, { limit: 10, offset: 1 });

        expect(result.data).toHaveLength(0);
        expect(result.meta.total).toBe(0);
      });
    });
  });
});
