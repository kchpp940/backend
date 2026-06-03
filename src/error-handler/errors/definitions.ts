import type { HttpStatus } from '@nestjs/common';

export enum ErrorCategory {
  APPLICATION = 'APPLICATION',
  DOMAIN = 'DOMAIN',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  SECURITY = 'SECURITY',
  UNKNOWN = 'UNKNOWN',
  VALIDATION = 'VALIDATION',
}

export enum ErrorCodes {
  DATABASE_FOREIGN_KEY = 'DATABASE_FOREIGN_KEY',
  DATABASE_NOT_FOUND = 'DATABASE_NOT_FOUND',
  DATABASE_UNIQUE_CONSTRAINT = 'DATABASE_UNIQUE_CONSTRAINT',
  DATABASE_VALIDATION = 'DATABASE_VALIDATION',
  DTO_VALIDATION_ERROR = 'DTO_VALIDATION_ERROR',
  FORBIDDEN = 'FORBIDDEN',
  HTTP_EXCEPTION = 'HTTP_EXCEPTION',
  INFRA_FAILURE = 'INFRA_FAILURE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  REDIS_ERROR = 'REDIS_ERROR',
  TODO_NOT_FOUND = 'TODO_NOT_FOUND',
  USER_IS_NOT_AUTHORIZED = 'USER_IS_NOT_AUTHORIZED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
}

export type ErrorCodeKeys = keyof typeof ErrorCodes;

export interface ErrorDefinition<TDetails = unknown> {
  category: ErrorCategory;
  code: ErrorCodes;
  defaultMessage: string;
  frontendMapper?: FrontendMapper<TDetails>;
  status: HttpStatus;
}

export type FrontendMapper<TDetails> = (details: TDetails) => unknown;

export const definitionBrand: unique symbol = Symbol('ErrorDefinitionBrand');

export interface BrandedDefinition<TDetails = unknown> extends ErrorDefinition<TDetails> {
  readonly [definitionBrand]: true;
}
