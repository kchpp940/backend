import { Injectable } from '@nestjs/common';

import { Todo } from '../../../database-manager/generated/client';
import { CreateTodoDto } from '../../api/todos/dtos/requests/create-todo.dto';
import { UpdateTodoDto } from '../../api/todos/dtos/requests/update-todo.dto';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { PaginatedEntity } from '../../shared/entities/paginated.entity';
import { TodoEntity } from './entities/todo.entity';
import { TodoMapper } from './mappers/todo.mapper';
import { TodoFilter, TodoPagination, TodoSort } from './types/todo.query';

@Injectable()
export class TodosRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateTodoDto): Promise<Todo> {
    return this.prisma.todo.create({ data: { ...dto, userId } });
  }

  async findAll(
    userId: string,
    filter: TodoFilter,
    { order, sortBy }: TodoSort,
    pagination: TodoPagination,
  ): Promise<PaginatedEntity<TodoEntity>> {
    const { limit, offset } = pagination;
    const orderBy = sortBy
      ? {
          [sortBy]: order,
        }
      : {};
    const where = { ...filter, userId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.todo.findMany({
        orderBy: orderBy,
        skip: (offset - 1) * limit,
        take: limit,
        where,
      }),
      this.prisma.todo.count({ where }),
    ]);

    return new PaginatedEntity<TodoEntity>({
      items: items.map((item) => TodoMapper.toEntity(item)),
      limit,
      offset,
      total,
    });
  }

  async findOne(id: string, userId: string): Promise<TodoEntity | void> {
    const todo = await this.prisma.todo.findFirst({ where: { id, userId } });

    if (todo) return TodoMapper.toEntity(todo);
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const result = await this.prisma.todo.deleteMany({ where: { id, userId } });

    return result.count > 0;
  }

  async update(id: string, userId: string, dto: UpdateTodoDto): Promise<TodoEntity | void> {
    const result = await this.prisma.todo.updateMany({ data: dto, where: { id, userId } });

    if (result.count === 0) return;

    const updated = await this.prisma.todo.findUnique({ where: { id } });

    if (!updated) return;

    return TodoMapper.toEntity(updated);
  }
}
