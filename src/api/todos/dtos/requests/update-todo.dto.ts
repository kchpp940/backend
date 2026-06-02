import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { buildMessage, IsBoolean, IsDate, IsEnum, IsOptional, IsString, ValidateBy } from 'class-validator';

import { TodoPriority } from '../../../../features/todos/interfaces/queries.enum';

const isValidDateObject = (date: Date): boolean => !Number.isNaN(date.getTime());

const ISO8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const INVALID_DATE = new Date(NaN);

const parseDueDateForUpdate = (value: unknown): Date | null | undefined => {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (value instanceof Date) return isValidDateObject(value) ? value : INVALID_DATE;
  if (typeof value === 'string') {
    if (!ISO8601_REGEX.test(value)) return INVALID_DATE;
    const date = new Date(value);

    return isValidDateObject(date) ? date : INVALID_DATE;
  }

  return INVALID_DATE;
};

const IsValidDueDateForUpdate = (): PropertyDecorator =>
  ValidateBy({
    name: 'isValidDueDateForUpdate',
    validator: {
      defaultMessage: buildMessage(
        (eachPrefix) =>
          `${eachPrefix}$property must be null, a valid ISO 8601 date string (e.g., 2026-06-15T12:00:00.000Z), or a valid Date object`,
      ),
      validate: (value: unknown) => {
        if (value === null || value === undefined) return true;

        return value instanceof Date && isValidDateObject(value);
      },
    },
  });

export class UpdateTodoDto {
  @ApiPropertyOptional({ default: false, required: false })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'ISO 8601 formatted due date, or null to clear. Example: 2026-06-15T12:00:00.000Z',
    example: '2026-06-15T12:00:00.000Z',
    nullable: true,
    required: false,
    type: Date,
  })
  @IsDate()
  @IsOptional()
  @IsValidDueDateForUpdate()
  @Transform(({ value }) => parseDueDateForUpdate(value))
  dueDate?: Date | null;

  @ApiPropertyOptional({
    description: 'Priority level: LOW, MEDIUM, or HIGH',
    enum: TodoPriority,
    example: TodoPriority.HIGH,
    required: false,
  })
  @IsEnum(TodoPriority, {
    message: `priority must be one of: ${Object.values(TodoPriority).join(', ')}`,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.toUpperCase().trim() : value))
  priority?: TodoPriority;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  title?: string;
}
