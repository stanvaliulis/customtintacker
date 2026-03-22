import { PrismaClient } from '@prisma/client';
import { isDatabaseConfigured } from './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  if (!isDatabaseConfigured()) {
    console.warn(
      '[Database] POSTGRES_PRISMA_URL is not set. Database queries will fail. ' +
      'The app will fall back to static product data where possible.',
    );
  }

  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
