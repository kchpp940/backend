import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../database-manager/generated/client';

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

  async create(userId: string, dto: CreateTodoDto): Promise<TodoEntity> {
    const todo = await this.prisma.todo.create({
      data: { ...dto, userId },
      include: { user: { select: { name: true } } },
    });

    return TodoMapper.toEntity(todo);
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

    const where: Prisma.TodoWhereInput = { ...filter, userId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.todo.findMany({
        include: { user: { select: { name: true } } },
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

  async findOne(id: string): Promise<TodoEntity | void> {
    const todo = await this.prisma.todo.findUnique({
      include: { user: { select: { name: true } } },
      where: { id },
    });

    if (todo) return TodoMapper.toEntity(todo);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.todo.delete({ where: { id } });
  }

  async update(id: string, dto: UpdateTodoDto): Promise<TodoEntity | void> {
    const todo = await this.prisma.todo.update({
      data: dto,
      include: { user: { select: { name: true } } },
      where: { id },
    });

    if (todo) return TodoMapper.toEntity(todo);
  }
}
