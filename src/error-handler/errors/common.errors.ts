import { HttpStatus } from '@nestjs/common';

import { ErrorCategory, ErrorCodes } from './definitions';
import { createErrorClass } from './factory';

export const ForbiddenError = createErrorClass<void>({
  category: ErrorCategory.DOMAIN,
  code: ErrorCodes.FORBIDDEN,
  defaultMessage: 'Forbidden',
  status: HttpStatus.FORBIDDEN,
});

export const InfraFailureError = createErrorClass<unknown>({
  category: ErrorCategory.INFRASTRUCTURE,
  code: ErrorCodes.INFRA_FAILURE,
  defaultMessage: 'Infrastructure Error',
  status: HttpStatus.INTERNAL_SERVER_ERROR,
});

export const InternalServerError = createErrorClass<void>({
  category: ErrorCategory.APPLICATION,
  code: ErrorCodes.INTERNAL_ERROR,
  defaultMessage: 'Internal Server Error',
  status: HttpStatus.INTERNAL_SERVER_ERROR,
});
