import { HttpStatus } from '@nestjs/common';

import { ErrorCategory, ErrorCodes } from './definitions';
import { createErrorClass } from './factory';

export const UserIsNotAuthorizedError = createErrorClass<void>({
  category: ErrorCategory.DOMAIN,
  code: ErrorCodes.USER_IS_NOT_AUTHORIZED,
  defaultMessage: 'User is not authorized',
  status: HttpStatus.UNAUTHORIZED,
});
