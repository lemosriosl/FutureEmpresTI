import { PrismaClient } from '@prisma/client';
import { validateDatabaseEnv } from '@/env';

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    validateDatabaseEnv();
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}
