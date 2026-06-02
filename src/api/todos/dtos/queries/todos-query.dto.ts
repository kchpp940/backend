import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { buildMessage, IsBoolean, IsDate, IsEnum, IsInt, IsOptional, IsString, Min, ValidateBy } from 'class-validator';

import {
  SortOrder,
  TodoPriority,
  TodoSearchField,
  TodoSortField,
} from '../../../../features/todos/interfaces/queries.enum';

const isValidDateObject = (date: Date): boolean => !Number.isNaN(date.getTime());

const ISO8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const INVALID_DATE = new Date(NaN);

const parseQueryDate = (value: unknown): Date | undefined => {
  if (value === null || value === undefined) return undefined;
  if (value instanceof Date) return isValidDateObject(value) ? value : INVALID_DATE;
  if (typeof value === 'string') {
    if (!ISO8601_REGEX.test(value)) return INVALID_DATE;
    const date = new Date(value);

    return isValidDateObject(date) ? date : INVALID_DATE;
  }

  return INVALID_DATE;
};

const IsValidQueryDate = (): PropertyDecorator =>
  ValidateBy({
    name: 'isValidQueryDate',
    validator: {
      defaultMessage: buildMessage(
        (eachPrefix) => `${eachPrefix}$property must be a valid ISO 8601 date string (e.g., 2026-06-15T12:00:00.000Z)`,
      ),
      validate: (value: unknown) => {
        if (value === null || value === undefined) return true;

        return value instanceof Date && isValidDateObject(value);
      },
    },
  });

export class TodosQueryDto {
  @ApiPropertyOptional({ description: 'Filter by completion status', example: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  completed?: boolean;

  @ApiPropertyOptional({
    description: 'Filter todos due on or after this ISO 8601 date. Example: 2026-06-01T00:00:00.000Z',
    example: '2026-06-01T00:00:00.000Z',
    type: Date,
  })
  @IsDate()
  @IsOptional()
  @IsValidQueryDate()
  @Transform(({ value }) => parseQueryDate(value))
  dueAfter?: Date;

  @ApiPropertyOptional({
    description: 'Filter todos due on or before this ISO 8601 date. Example: 2026-06-15T12:00:00.000Z',
    example: '2026-06-15T12:00:00.000Z',
    type: Date,
  })
  @IsDate()
  @IsOptional()
  @IsValidQueryDate()
  @Transform(({ value }) => parseQueryDate(value))
  dueBefore?: Date;

  @ApiPropertyOptional({ default: 10, example: 10 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ default: 0, example: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;

  @ApiPropertyOptional({ enum: SortOrder })
  @IsEnum(SortOrder)
  @IsOptional()
  order?: SortOrder;

  @ApiPropertyOptional({
    description: 'Filter by priority level: LOW, MEDIUM, or HIGH (case-insensitive)',
    enum: TodoPriority,
    example: TodoPriority.HIGH,
  })
  @IsEnum(TodoPriority, {
    message: `priority must be one of: ${Object.values(TodoPriority).join(', ')}`,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.toUpperCase().trim() : value))
  priority?: TodoPriority;

  @ApiPropertyOptional({ example: 'buy milk' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: TodoSearchField, example: TodoSearchField.TITLE })
  @IsEnum(TodoSearchField)
  @IsOptional()
  searchField?: string;

  @ApiPropertyOptional({ enum: TodoSortField })
  @IsEnum(TodoSortField)
  @IsOptional()
  sortBy?: TodoSortField;
}
