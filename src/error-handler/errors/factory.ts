import type { BrandedDefinition, ErrorCategory, ErrorCodes, ErrorDefinition, FrontendMapper } from './definitions';

import { BaseError } from './base.error';
import { definitionBrand } from './definitions';
import { registerError } from './registry';

type ConstructorParams<TDetails> = [TDetails] extends [void]
  ? [message?: string]
  : [details: TDetails, message?: string];

interface ErrorClass<TDetails> {
  readonly category: ErrorCategory;
  readonly code: ErrorCodes;
  readonly defaultMessage: string;
  readonly definition: BrandedDefinition<TDetails>;
  readonly frontendMapper?: FrontendMapper<TDetails>;
  readonly status: number;
  new (...args: ConstructorParams<TDetails>): BaseError<TDetails>;
}

export function createErrorClass<TDetails = void>(definition: ErrorDefinition<TDetails>): ErrorClass<TDetails> {
  const branded = brand(definition);

  registerError(branded);

  class ConcreteError extends BaseError<TDetails> {
    static readonly category = branded.category;
    static readonly code = branded.code;
    static readonly defaultMessage = branded.defaultMessage;
    static readonly definition = branded;
    static readonly frontendMapper = branded.frontendMapper;
    static readonly status = branded.status;

    constructor(...args: ConstructorParams<TDetails>) {
      let message: string | undefined;
      let details: TDetails | undefined;

      if (args.length === 2) {
        [details, message] = args as [TDetails, string];
      } else if (args.length === 1) {
        if (typeof args[0] === 'string') {
          message = args[0];
        } else {
          details = args[0];
        }
      }

      super(branded, message || branded.defaultMessage, details);
    }
  }

  return ConcreteError;
}

function brand<TDetails>(definition: ErrorDefinition<TDetails>): BrandedDefinition<TDetails> {
  return Object.assign(definition, { [definitionBrand]: true as const });
}
