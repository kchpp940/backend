import { Test } from '@nestjs/testing';

import { prismaMock, resetPrismaTransactionMock } from '../../mocks/prisma.mock';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { AuditAction } from './enums/audit-action.enum';
import { TodoAuditsRepository } from './todo-audits.repository';
import { TodoAuditsService } from './todo-audits.service';

const auditRecord = {
  action: 'CREATE',
  after: { completed: false, id: 'todo-1', title: 'Test' },
  before: null,
  createdAt: new Date(),
  id: 'audit-1',
  operatorId: 'user-1',
  todoId: 'todo-1',
  traceId: '',
};

describe('TodoAuditsService', () => {
  let service: TodoAuditsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TodoAuditsService, TodoAuditsRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(TodoAuditsService);

    jest.clearAllMocks();
    resetPrismaTransactionMock();
  });

  describe('recordAudit', () => {
    describe('positive cases', () => {
      it('creates audit record via repository', async () => {
        prismaMock.todoAudit.create.mockResolvedValue(auditRecord);

        await service.recordAudit({
          action: AuditAction.CREATE,
          after: { completed: false, id: 'todo-1', title: 'Test' },
          before: null,
          operatorId: 'user-1',
          todoId: 'todo-1',
          traceId: '',
        });

        expect(prismaMock.todoAudit.create).toHaveBeenCalled();
      });

      it('passes transaction client to repository when provided', async () => {
        prismaMock.todoAudit.create.mockResolvedValue(auditRecord);

        const tx = prismaMock;
        await service.recordAudit(
          {
            action: AuditAction.CREATE,
            operatorId: 'user-1',
            todoId: 'todo-1',
            traceId: 'trace-1',
          },
          tx,
        );

        expect(prismaMock.todoAudit.create).toHaveBeenCalled();
      });
    });

    describe('negative cases', () => {
      it('propagates error when repository fails', async () => {
        prismaMock.todoAudit.create.mockRejectedValue(new Error('db error'));

        await expect(
          service.recordAudit({
            action: AuditAction.CREATE,
            operatorId: 'user-1',
            todoId: 'todo-1',
            traceId: '',
          }),
        ).rejects.toThrow('db error');
      });
    });
  });

  describe('buildAuditInput', () => {
    it('builds input with provided traceId', () => {
      const result = service.buildAuditInput({
        action: AuditAction.CREATE,
        after: { id: 'todo-1', title: 'Test' },
        operatorId: 'user-1',
        todoId: 'todo-1',
        traceId: 'trace-123',
      });

      expect(result.action).toBe(AuditAction.CREATE);
      expect(result.operatorId).toBe('user-1');
      expect(result.todoId).toBe('todo-1');
      expect(result.after).toEqual({ id: 'todo-1', title: 'Test' });
      expect(result.before).toBeNull();
      expect(result.traceId).toBe('trace-123');
    });

    it('uses provided before value', () => {
      const result = service.buildAuditInput({
        action: AuditAction.UPDATE,
        before: { completed: false, id: 'todo-1', title: 'Old' },
        operatorId: 'user-1',
        todoId: 'todo-1',
        traceId: 'trace-456',
      });

      expect(result.before).toEqual({ completed: false, id: 'todo-1', title: 'Old' });
      expect(result.after).toBeNull();
      expect(result.traceId).toBe('trace-456');
    });
  });

  describe('findAll', () => {
    describe('positive cases', () => {
      it('delegates to repository with correct params', async () => {
        prismaMock.$transaction.mockResolvedValue([[auditRecord], 1]);

        const result = await service.findAll({ action: 'CREATE' }, { limit: 10, offset: 1 });

        expect(result.data).toHaveLength(1);
        expect(result.meta.total).toBe(1);
      });
    });
  });
});
