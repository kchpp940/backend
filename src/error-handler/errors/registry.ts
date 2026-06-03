import type { BrandedDefinition } from './definitions';

class ErrorRegistry {
  private definitions: BrandedDefinition[] = [];

  getAll(): BrandedDefinition[] {
    return [...this.definitions];
  }

  register<TDetails>(definition: BrandedDefinition<TDetails>): void {
    this.definitions.push(definition as BrandedDefinition);
  }
}

export const errorRegistry = new ErrorRegistry();

export function registerError<TDetails>(definition: BrandedDefinition<TDetails>): BrandedDefinition<TDetails> {
  errorRegistry.register(definition);

  return definition;
}
