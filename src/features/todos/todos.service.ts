import { Injectable } from '@nestjs/common';

import { TodosQueryDto } from '../../api/todos/dtos/queries/todos-query.dto';
import { CreateTodoDto } from '../../api/todos/dtos/requests/create-todo.dto';
import { UpdateTodoDto } from '../../api/todos/dtos/requests/update-todo.dto';
import { TodoNotFoundError } from '../../error-handler/errors/todo.errors';
import { PaginatedEntity } from '../../shared/entities/paginated.entity';
import { TodoEntity } from './entities/todo.entity';
import { SortOrder, TodoSearchField, TodoSortField } from './interfaces/queries.enum';
import { TodosCacheService } from './todos.cache.service';
import { TodosRepository } from './todos.repository';
import { TodoFilter, TodoPagination, TodoSort } from './types/todo.query';

@Injectable()
export class TodosService {
  constructor(
    private readonly todosRepository: TodosRepository,
    private readonly todosCacheService: TodosCacheService,
  ) {}

  async create(userId: string, dto: CreateTodoDto): Promise<TodoEntity | void> {
    const todo = await this.todosRepository.create(userId, dto);

    await this.todosCacheService.invalidateTodosByUser(userId);

    return todo;
  }

  async findAll(userId: string, queryDto: TodosQueryDto): Promise<PaginatedEntity<TodoEntity>> {
    const cached = await this.todosCacheService.getTodos(userId, queryDto);

    if (cached) return cached;

    const sortQuery = this.getSortQuery(queryDto);
    const filterQuery = this.getFilterQuery(queryDto);
    const paginationQuery = this.getPaginationQuery(queryDto);

    const result = await this.todosRepository.findAll(userId, filterQuery, sortQuery, paginationQuery);

    await this.todosCacheService.setTodos(userId, queryDto, result);

    return result;
  }

  async findOne(userId: string, id: string): Promise<TodoEntity> {
    const cached = await this.todosCacheService.getTodo(userId, id);

    if (cached) return cached;

    const todo = await this.todosRepository.findOne(id);

    if (!todo) throw new TodoNotFoundError(id);

    await this.todosCacheService.setTodo(userId, id, todo);

    return todo;
  }

  getFilterQuery({ completed, search, searchField = TodoSearchField.TITLE }: TodosQueryDto): TodoFilter {
    return {
      ...(completed !== undefined && {
        completed,
      }),
      ...(search && {
        [searchField]: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    };
  }

  getPaginationQuery({ limit, offset }: TodosQueryDto): TodoPagination {
    const defaultLimit = 10;
    const _offset = Math.max(Number(offset) || 1, 1);
    const _limit = Math.max(Number(limit) || defaultLimit, 1);

    return { limit: _limit, offset: _offset };
  }

  getSortQuery({ order, sortBy }: TodosQueryDto): TodoSort {
    if (!sortBy) {
      return { order: order ?? SortOrder.DESC, sortBy: TodoSortField.TITLE };
    }

    return { order: order ?? SortOrder.DESC, sortBy: sortBy };
  }

  async remove(userId: string, id: string): Promise<void> {
    const todo = await this.todosRepository.findOne(id);

    if (!todo) throw new TodoNotFoundError(id);

    await this.todosRepository.remove(id);

    await this.todosCacheService.invalidateAllForUser(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateTodoDto): Promise<TodoEntity | void> {
    const todo = await this.todosRepository.findOne(id);

    if (!todo) throw new TodoNotFoundError(id);

    const updated = await this.todosRepository.update(id, dto);

    await this.todosCacheService.invalidateAllForUser(userId, id);

    return updated;
  }
}
