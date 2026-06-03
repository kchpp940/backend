import type { ExecutionContext } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { UserIsNotAuthorizedError } from '../../error-handler/errors/user.errors';
import { AuthGuard } from './auth.guard';

const makeContext = (auth?: string, isPublic = false): ExecutionContext => {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);

  return {
    getClass: jest.fn(),
    getHandler: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ header: jest.fn().mockReturnValue(auth) }),
    }),
  } as unknown as ExecutionContext;
};

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AuthGuard(reflector);
  });

  describe('negative cases', () => {
    it('throws when Authorization header is absent', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const ctx = makeContext(undefined);

      expect(() => guard.canActivate(ctx)).toThrow(UserIsNotAuthorizedError);
    });

    it('throws when Authorization prefix is not Bearer', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const ctx = makeContext('Basic dXNlcjE=');

      expect(() => guard.canActivate(ctx)).toThrow(UserIsNotAuthorizedError);
    });
  });

  describe('positive cases', () => {
    it('returns true for public routes without checking auth', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const ctx = makeContext(undefined, true);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('sets userId on request from Bearer token', () => {
      const userId = 'user-123';
      const token = Buffer.from(userId).toString('base64');
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const req = { header: jest.fn().mockReturnValue(`Bearer ${token}`) } as unknown as Record<string, unknown>;
      const ctx = {
        getClass: jest.fn(),
        getHandler: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({ getRequest: jest.fn().mockReturnValue(req) }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(req.userId).toBe(userId);
    });

    it('decodes base64 token to ASCII userId', () => {
      const userId = 'special-user@example.com';
      const token = Buffer.from(userId).toString('base64');
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const req = { header: jest.fn().mockReturnValue(`Bearer ${token}`) } as unknown as Record<string, unknown>;
      const ctx = {
        getClass: jest.fn(),
        getHandler: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({ getRequest: jest.fn().mockReturnValue(req) }),
      } as unknown as ExecutionContext;

      guard.canActivate(ctx);

      expect(req.userId).toBe(userId);
    });
  });
});
