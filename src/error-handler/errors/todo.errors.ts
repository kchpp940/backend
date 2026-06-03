import { HttpStatus } from '@nestjs/common';

import { ErrorCategory, ErrorCodes } from './definitions';
import { createErrorClass } from './factory';

export const TodoNotFoundError = createErrorClass<{ id: string }>({
  category: ErrorCategory.DOMAIN,
  code: ErrorCodes.TODO_NOT_FOUND,
  defaultMessage: 'Todo not found',
  status: HttpStatus.NOT_FOUND,
});
