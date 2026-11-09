import { Prisma, type PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export type TenantAccess = { tenantId: string; userId: string };

export async function resolveMembership(db: PrismaClient, userId: string) {
  const memberships = await db.membership.findMany({
    where: { userId },
    select: { tenantId: true, role: true },
    take: 2,
  });
  return memberships.length === 1 ? memberships[0] : null;
}

export function tenantTransaction<T>(
  db: PrismaClient,
  access: TenantAccess,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  isolationLevel?: Prisma.TransactionIsolationLevel,
) {
  const { tenantId, userId } = access;
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL ROLE authenticated`;
    await tx.$queryRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    const membership = await tx.membership.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
      select: { userId: true },
    });
    if (!membership) throw new TRPCError({ code: 'FORBIDDEN', message: 'Seu acesso a este catálogo não está ativo.' });
    return operation(tx);
  }, { isolationLevel });
}
