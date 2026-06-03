import { HttpStatus } from '@nestjs/common';

import { ErrorCategory, ErrorCodes } from './definitions';
import { createErrorClass } from './factory';

function hideInfraDetails(details: Error): unknown {
  return {
    message: details.message,
  };
}

export const RedisError = createErrorClass<Error>({
  category: ErrorCategory.INFRASTRUCTURE,
  code: ErrorCodes.REDIS_ERROR,
  defaultMessage: 'System Error',
  frontendMapper: hideInfraDetails,
  status: HttpStatus.INTERNAL_SERVER_ERROR,
});
