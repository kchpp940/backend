import { Test } from '@nestjs/testing';

import { AuditAction } from '../../features/todo-audits/enums/audit-action.enum';
import { TodoAuditsService } from '../../features/todo-audits/todo-audits.service';
import { TodoAuditsController } from './todo-audits.controller';

const auditData = {
  action: 'CREATE',
  after: { completed: false, id: 'todo-1', title: 'Test' },
  before: null,
  createdAt: new Date(),
  id: 'audit-1',
  operatorId: 'user-1',
  todoId: 'todo-1',
  traceId: 'trace-123',
};

describe('TodoAuditsController', () => {
  let controller: TodoAuditsController;
  let service: { findAll: jest.Mock };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [TodoAuditsController],
      providers: [{ provide: TodoAuditsService, useValue: service }],
    }).compile();

    controller = module.get(TodoAuditsController);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    describe('positive cases', () => {
      it('returns paginated audit logs', async () => {
        const paginatedResult = {
          data: [auditData],
          meta: { limit: 10, offset: 1, total: 1 },
        };
        service.findAll.mockResolvedValue(paginatedResult);

        const result = await controller.findAll({});

        expect(service.findAll).toHaveBeenCalledWith({}, { limit: 10, offset: 1 });
        expect(result).toBeDefined();
      });

      it('passes filter params to service', async () => {
        service.findAll.mockResolvedValue({ data: [], meta: { limit: 10, offset: 1, total: 0 } });

        await controller.findAll({ action: AuditAction.CREATE, operatorId: 'user-1', todoId: 'todo-1' });

        expect(service.findAll).toHaveBeenCalledWith(
          { action: AuditAction.CREATE, operatorId: 'user-1', todoId: 'todo-1' },
          { limit: 10, offset: 1 },
        );
      });

      it('passes custom pagination params to service', async () => {
        service.findAll.mockResolvedValue({ data: [], meta: { limit: 20, offset: 2, total: 0 } });

        await controller.findAll({ limit: 20, offset: 2 });

        expect(service.findAll).toHaveBeenCalledWith({}, { limit: 20, offset: 2 });
      });
    });
  });
});
