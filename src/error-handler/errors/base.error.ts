import type { HttpStatus } from '@nestjs/common';

import type { BrandedDefinition, ErrorCategory, ErrorCodes, FrontendMapper } from './definitions';

type BaseErrorConstructor<TDetails> = typeof BaseError<TDetails> & {
  readonly definition: BrandedDefinition<TDetails>;
  readonly frontendMapper?: FrontendMapper<TDetails>;
};

export class BaseError<TDetails = unknown> extends Error {
  public readonly category: ErrorCategory;
  public readonly code: ErrorCodes;
  public readonly details?: TDetails;
  public readonly status: HttpStatus;

  constructor(definition: BrandedDefinition<TDetails>, message: string, details?: TDetails) {
    super(message);
    this.category = definition.category;
    this.code = definition.code;
    this.details = details;
    this.status = definition.status;
  }

  getFrontendDetails(): unknown {
    if (typeof this.details === 'undefined') {
      return undefined;
    }

    const ctor = this.constructor as BaseErrorConstructor<TDetails>;
    const mapper = ctor.frontendMapper;

    if (mapper) {
      return mapper(this.details);
    }

    return this.details;
  }
}
