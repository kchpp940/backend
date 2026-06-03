import { InfraFailureError } from '../errors/common.errors';

export async function safeExec<T>(fn: () => Promise<T>, context: string): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw new InfraFailureError(e, `Infrastructure error in ${context}`);
  }
}
