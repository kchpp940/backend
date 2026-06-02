import { Injectable } from '@nestjs/common';

import { Todo } from '../../../database-manager/generated/client';
import { CreateTodoDto } from '../../api/todos/dtos/requests/create-todo.dto';
import { UpdateTodoDto } from '../../api/todos/dtos/requests/update-todo.dto';
import { PrismaService, PrismaTransactionClient } from '../../modules/prisma/prisma.service';
import { PaginatedEntity } from '../../shared/entities/paginated.entity';
import { TodoEntity } from './entities/todo.entity';
import { TodoMapper } from './mappers/todo.mapper';
import { TodoFilter, TodoPagination, TodoSort } from './types/todo.query';

@Injectable()
export class TodosRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateTodoDto, tx?: PrismaTransactionClient): Promise<Todo> {
    const client = this.getClient(tx);

    return client.todo.create({ data: { ...dto, userId } });
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

  async findOne(id: string, userId?: string, tx?: PrismaTransactionClient): Promise<TodoEntity | void> {
    const client = this.getClient(tx);
    const where = userId ? { id, userId } : { id };
    const todo = userId ? await client.todo.findFirst({ where }) : await client.todo.findUnique({ where });

    if (todo) return TodoMapper.toEntity(todo);
  }

  async remove(id: string, userId: string, tx?: PrismaTransactionClient): Promise<void> {
    const client = this.getClient(tx);
    await this.findOne(id, userId, tx);
    await client.todo.delete({ where: { id, userId } });
  }

  async update(
    id: string,
    dto: UpdateTodoDto,
    userId: string,
    tx?: PrismaTransactionClient,
  ): Promise<TodoEntity | void> {
    const client = this.getClient(tx);
    const todo = await client.todo.update({ data: dto, where: { id, userId } });

    if (todo) return TodoMapper.toEntity(todo);
  }

  private getClient(tx?: PrismaTransactionClient): PrismaService | PrismaTransactionClient {
    return tx ?? this.prisma;
  }
}
