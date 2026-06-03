import { isObject } from '../../common/utils/objects';

export function frontendMapper(details: unknown): unknown {
  const message =
    isObject(details) &&
    isObject(details.driverAdapterError) &&
    isObject(details.driverAdapterError.cause) &&
    typeof details.driverAdapterError.cause.message === 'string'
      ? details.driverAdapterError.cause.message
      : undefined;

  return message ?? details;
}
