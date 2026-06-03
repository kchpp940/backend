import { HttpStatus } from '@nestjs/common';

import type { BaseError } from './base.error';

import { Prisma } from '../../../database-manager/generated/client';
import { isObject } from '../../common/utils/objects';
import { ErrorCategory, ErrorCodes } from './definitions';
import { createErrorClass } from './factory';

export function hideDatabaseDetails(details: Record<string, unknown>): unknown {
  const causeMessage =
    isObject(details) &&
    isObject(details.driverAdapterError) &&
    isObject(details.driverAdapterError.cause) &&
    typeof details.driverAdapterError.cause.message === 'string'
      ? details.driverAdapterError.cause.message
      : undefined;

  return causeMessage ?? { message: 'Database constraint violation' };
}

export const DatabaseValidationError = createErrorClass<Record<string, unknown>>({
  category: ErrorCategory.INFRASTRUCTURE,
  code: ErrorCodes.DATABASE_VALIDATION,
  defaultMessage: 'Validation Error',
  frontendMapper: hideDatabaseDetails,
  status: HttpStatus.BAD_REQUEST,
});

export const DatabaseUniqueConstraintError = createErrorClass<Record<string, unknown>>({
  category: ErrorCategory.INFRASTRUCTURE,
  code: ErrorCodes.DATABASE_UNIQUE_CONSTRAINT,
  defaultMessage: 'Conflict',
  frontendMapper: hideDatabaseDetails,
  status: HttpStatus.CONFLICT,
});

export const DatabaseForeignKeyError = createErrorClass<Record<string, unknown>>({
  category: ErrorCategory.INFRASTRUCTURE,
  code: ErrorCodes.DATABASE_FOREIGN_KEY,
  defaultMessage: 'Foreign Key Constraint Failed',
  frontendMapper: hideDatabaseDetails,
  status: HttpStatus.CONFLICT,
});

export const DatabaseNotFoundError = createErrorClass<Record<string, unknown>>({
  category: ErrorCategory.INFRASTRUCTURE,
  code: ErrorCodes.DATABASE_NOT_FOUND,
  defaultMessage: 'Not Found',
  frontendMapper: hideDatabaseDetails,
  status: HttpStatus.NOT_FOUND,
});

export function mapPrismaError(err: unknown): BaseError<Error | Record<string, unknown> | void> | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2000':
      case 'P2006':
      case 'P2007':
      case 'P2011':
        return new DatabaseValidationError(err.meta as Record<string, unknown>, 'Validation Error');
      case 'P2002':
        return new DatabaseUniqueConstraintError(err.meta as Record<string, unknown>, 'Unique constraint failed');
      case 'P2003':
        return new DatabaseForeignKeyError(err.meta as Record<string, unknown>, 'Foreign key constraint failed');
      case 'P2025':
        return new DatabaseNotFoundError(err.meta as Record<string, unknown>, 'Record not found');
    }
  }

  return null;
}
