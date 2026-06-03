import type { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';

import type { PrismaService } from '../prisma/prisma.service';
import type { RedisHealthService } from '../redis-manager/redis-health.service';
import type { ShutdownHealthService } from '../shutdown/shutdown-health.service';

import { HealthChecks } from './health.checks';

describe('HealthChecks', () => {
  let service: HealthChecks;
  let healthCheckService: { check: jest.Mock<Promise<unknown>, [unknown[]]> };
  let dbIndicator: { pingCheck: jest.Mock };
  let redisHealth: { pingCheck: jest.Mock };
  let shutdownHealth: { check: jest.Mock };

  beforeEach(() => {
    healthCheckService = {
      check: jest.fn<Promise<unknown>, [unknown[]]>().mockResolvedValue({ details: {}, status: 'ok' }),
    };

    dbIndicator = {
      pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
    };

    redisHealth = {
      pingCheck: jest.fn().mockResolvedValue({ redis: { status: 'up' } }),
    };

    shutdownHealth = {
      check: jest.fn().mockReturnValue({ shutdown: { status: 'up' } }),
    };

    service = new HealthChecks(
      healthCheckService as unknown as HealthCheckService,
      dbIndicator as unknown as PrismaHealthIndicator,
      {} as PrismaService,
      redisHealth as unknown as RedisHealthService,
      shutdownHealth as unknown as ShutdownHealthService,
    );
  });

  describe('positive cases', () => {
    it('runAll calls health.check', async () => {
      await service.runAll();

      expect(healthCheckService.check).toHaveBeenCalledWith(expect.any(Array));
    });

    it('runCritical calls health.check', async () => {
      await service.runCritical();

      expect(healthCheckService.check).toHaveBeenCalledWith(expect.any(Array));
    });

    it('runAll returns health check result', async () => {
      const result = await service.runAll();

      expect(result).toEqual({ details: {}, status: 'ok' });
    });

    it('runAll passes two check functions', async () => {
      await service.runAll();

      expect(healthCheckService.check.mock.calls[0][0]).toHaveLength(2);
    });

    it('runCritical passes two check functions', async () => {
      await service.runCritical();

      expect(healthCheckService.check.mock.calls[0][0]).toHaveLength(2);
    });

    it('runAll executes the db ping check function', async () => {
      healthCheckService.check.mockImplementation(async (checks) => {
        for (const fn of checks as (() => Promise<unknown>)[]) await fn();

        return { details: {}, status: 'ok' };
      });

      await service.runAll();

      expect(dbIndicator.pingCheck).toHaveBeenCalled();
    });

    it('runAll executes the redis ping check function', async () => {
      healthCheckService.check.mockImplementation(async (checks) => {
        for (const fn of checks as (() => Promise<unknown>)[]) await fn();

        return { details: {}, status: 'ok' };
      });

      await service.runAll();

      expect(redisHealth.pingCheck).toHaveBeenCalled();
    });

    it('runCritical executes the shutdown check function', async () => {
      healthCheckService.check.mockImplementation((checks: unknown[]) => {
        for (const fn of checks as (() => unknown)[]) fn();

        return { details: {}, status: 'ok' } as never;
      });

      await service.runCritical();

      expect(shutdownHealth.check).toHaveBeenCalled();
    });
  });
});
