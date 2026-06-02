import type { PrismaTransactionClient } from '../modules/prisma/prisma.service';

type MockPrismaClient = PrismaTransactionClient & {
  $transaction: jest.Mock;
  todo: {
    count: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  todoAudit: {
    count: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
  };
};

const defaultTransactionImpl = async (input: unknown): Promise<unknown> => {
  if (Array.isArray(input)) {
    return Promise.all(input);
  }
  if (typeof input === 'function') {
    return (input as (client: MockPrismaClient) => Promise<unknown>)(prismaMock);
  }
  throw new Error('Unsupported $transaction usage');
};

export const prismaMock: MockPrismaClient = {
  $executeRaw: jest.fn(),
  $executeRawUnsafe: jest.fn(),
  $queryRaw: jest.fn(),
  $queryRawUnsafe: jest.fn(),
  $transaction: jest.fn(defaultTransactionImpl),
  todo: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  todoAudit: {
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
} as unknown as MockPrismaClient;

export const resetPrismaTransactionMock = (): void => {
  prismaMock.$transaction.mockImplementation(defaultTransactionImpl);
};
