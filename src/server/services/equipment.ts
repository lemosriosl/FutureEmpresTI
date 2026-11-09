import { Prisma, type PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { tenantTransaction, type TenantAccess } from '@/server/tenant';

const pageSize = 12;

function equipmentView(tenantId: string) {
  return {
    id: true,
    patrimonio: true,
    name: true,
    category: true,
    location: true,
    status: true,
    loans: {
      where: { tenantId, returnedAt: null },
      select: { id: true },
      take: 1,
    },
  } satisfies Prisma.EquipmentSelect;
}

function catalogItem({ loans, status, ...equipment }: Prisma.EquipmentGetPayload<{ select: ReturnType<typeof equipmentView> }>) {
  return {
    ...equipment,
    status: status === 'AVAILABLE' && loans.length ? 'BORROWED' as const : status,
  };
}

export async function listEquipment(
  db: PrismaClient,
  access: TenantAccess,
  input: { cursor?: string; availableOnly?: boolean },
) {
  const { tenantId } = access;
  const rows = await tenantTransaction(db, access, (tx) => tx.equipment.findMany({
    where: {
      tenantId,
      patrimonio: input.cursor ? { gt: input.cursor } : undefined,
      status: input.availableOnly ? 'AVAILABLE' : { not: 'OUT_OF_SERVICE' },
      loans: input.availableOnly ? { none: { tenantId, returnedAt: null } } : undefined,
    },
    select: equipmentView(tenantId),
    orderBy: { patrimonio: 'asc' },
    take: pageSize + 1,
  }));
  const items = rows.slice(0, pageSize).map(catalogItem);
  return { items, nextCursor: rows.length > pageSize ? items.at(-1)?.patrimonio : undefined };
}

export async function getEquipment(db: PrismaClient, access: TenantAccess, patrimonio: string) {
  const { tenantId } = access;
  const equipment = await tenantTransaction(db, access, (tx) => tx.equipment.findUnique({
    where: { tenantId_patrimonio: { tenantId, patrimonio }, status: { not: 'OUT_OF_SERVICE' } },
    select: equipmentView(tenantId),
  }));
  if (!equipment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipamento não encontrado.' });
  return catalogItem(equipment);
}
