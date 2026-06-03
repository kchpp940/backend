import { HttpStatus } from '@nestjs/common';

import { ErrorCategory } from '../constants/error-category';
import { ErrorCodes } from '../constants/error.codes';
import { BaseError } from './_base.error';

export class AdminNotConfiguredError extends BaseError<void> {
  static code = ErrorCodes.ADMIN_NOT_CONFIGURED;
  static domain = ErrorCategory.DOMAIN;
  static message = 'Administrator access is not configured for this instance';
  static status = HttpStatus.FORBIDDEN;

  constructor() {
    super(
      AdminNotConfiguredError.message,
      AdminNotConfiguredError.code,
      AdminNotConfiguredError.domain,
      AdminNotConfiguredError.status,
    );
  }
}

export class UserInsufficientPermissionsError extends BaseError<void> {
  static code = ErrorCodes.USER_INSUFFICIENT_PERMISSIONS;
  static domain = ErrorCategory.DOMAIN;
  static message = 'User has insufficient permissions';
  static status = HttpStatus.FORBIDDEN;

  constructor(message?: string) {
    super(
      message ?? UserInsufficientPermissionsError.message,
      UserInsufficientPermissionsError.code,
      UserInsufficientPermissionsError.domain,
      UserInsufficientPermissionsError.status,
    );
  }
}

export class UserIsNotAuthorizedError extends BaseError<void> {
  static code = ErrorCodes.USER_IS_NOT_AUTHORIZED;
  static domain = ErrorCategory.DOMAIN;
  static message = 'User is not authorized';
  static status = HttpStatus.UNAUTHORIZED;

  constructor() {
    super(
      UserIsNotAuthorizedError.message,
      UserIsNotAuthorizedError.code,
      UserIsNotAuthorizedError.domain,
      UserIsNotAuthorizedError.status,
    );
  }
}
