import type { ValidationError } from 'class-validator';

import { HttpStatus } from '@nestjs/common';

import { ErrorCategory, ErrorCodes } from './definitions';
import { createErrorClass } from './factory';

export function parseValidationErrors(errors: ValidationError[], parentPath = ''): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const error of errors) {
    const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      result[fieldPath] = Object.values(error.constraints);
    }

    if (error.children?.length) {
      Object.assign(result, parseValidationErrors(error.children, fieldPath));
    }
  }

  return result;
}

export const DtoValidationError = createErrorClass<Record<string, string[]>>({
  category: ErrorCategory.VALIDATION,
  code: ErrorCodes.DTO_VALIDATION_ERROR,
  defaultMessage: 'Validation Error',
  status: HttpStatus.UNPROCESSABLE_ENTITY,
});
