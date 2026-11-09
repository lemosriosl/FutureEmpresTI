import { Prisma, type EquipmentStatus, type PrismaClient } from '@prisma/client';

const inventory = [
  ['TI-0001', 'Notebook 14 polegadas', 'notebook', 'AVAILABLE'],
  ['TI-0002', 'Notebook 15 polegadas', 'notebook', 'AVAILABLE'],
  ['TI-0003', 'Notebook 13 polegadas', 'notebook', 'AVAILABLE'],
  ['TI-0004', 'Notebook 15 polegadas', 'notebook', 'MAINTENANCE'],
  ['TI-0005', 'Monitor 24 polegadas', 'monitor', 'AVAILABLE'],
  ['TI-0006', 'Monitor 27 polegadas', 'monitor', 'AVAILABLE'],
  ['TI-0007', 'Monitor 22 polegadas', 'monitor', 'MAINTENANCE'],
  ['TI-0008', 'Cabo HDMI 2 m', 'cabo', 'AVAILABLE'],
  ['TI-0009', 'Cabo USB-C 1 m', 'cabo', 'AVAILABLE'],
  ['TI-0010', 'Cabo de rede 3 m', 'cabo', 'AVAILABLE'],
  ['TI-0011', 'Webcam Full HD', 'câmera', 'AVAILABLE'],
  ['TI-0012', 'Câmera compacta', 'câmera', 'AVAILABLE'],
] satisfies Array<[string, string, string, EquipmentStatus]>;

const legacy = ['NB-001', 'NB-002', 'MON-001', 'CAB-001', 'CAM-001'];
export const entrega3Patrimonios = inventory.map(([patrimonio]) => patrimonio);
const approved = new Set([...entrega3Patrimonios, ...legacy]);
const serializable = { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20_000 };

export class Entrega3Error extends Error {}

async function getTenantId(tx: Prisma.TransactionClient) {
  const tenant = await tx.tenant.findUnique({ where: { slug: 'suporte_ti' }, select: { id: true } });
  if (!tenant) throw new Entrega3Error('O tenant suporte_ti precisa existir antes da carga.');
  return tenant.id;
}

export function loadEntrega3Catalog(db: PrismaClient) {
  return db.$transaction(async (tx) => {
    const tenantId = await getTenantId(tx);
    const existing = await tx.equipment.findMany({ where: { tenantId }, select: { patrimonio: true } });
    if (existing.some(({ patrimonio }) => !approved.has(patrimonio))) {
      throw new Entrega3Error('Há patrimônios fora do inventário e dos cinco itens autorizados.');
    }

    const activeLoans = await tx.loan.count({
      where: { tenantId, returnedAt: null, equipment: { tenantId, patrimonio: { in: legacy } } },
    });
    if (activeLoans) throw new Entrega3Error('Há empréstimos em aberto nos itens que seriam retirados.');

    await tx.equipment.createMany({
      data: inventory.map(([patrimonio, name, category, status]) => ({ tenantId, patrimonio, name, category, status })),
      skipDuplicates: true,
    });
    const retired = await tx.equipment.updateMany({
      where: { tenantId, patrimonio: { in: legacy }, status: { not: 'OUT_OF_SERVICE' } },
      data: { status: 'OUT_OF_SERVICE' },
    });
    const catalog = await tx.equipment.findMany({
      where: { tenantId, status: { not: 'OUT_OF_SERVICE' } },
      orderBy: { patrimonio: 'asc' },
      select: { id: true, patrimonio: true, status: true },
    });
    return { newlyRetired: retired.count, catalog };
  }, serializable);
}

export function linkEntrega3Professor(db: PrismaClient, email: string) {
  return db.$transaction(async (tx) => {
    const tenantId = await getTenantId(tx);
    const users = await tx.$queryRaw<{ id: string }[]>`
      SELECT id::text FROM auth.users
      WHERE lower(email) = lower(${email}) AND email_confirmed_at IS NOT NULL
      LIMIT 2
    `;
    if (users.length !== 1) throw new Entrega3Error('É preciso criar e confirmar a conta indicada no Supabase Auth.');

    const userId = users[0].id;
    const memberships = await tx.membership.findMany({ where: { userId }, select: { tenantId: true, role: true } });
    if (memberships.some((membership) => membership.tenantId !== tenantId || membership.role !== 'COLLABORATOR')) {
      throw new Entrega3Error('A conta já tem um vínculo incompatível com a prática.');
    }
    if (await tx.loan.count({ where: { tenantId, borrowerId: userId } })) {
      throw new Entrega3Error('A conta indicada já tem empréstimos no tenant da prática.');
    }

    await tx.membership.upsert({
      where: { userId_tenantId: { userId, tenantId } },
      create: { userId, tenantId, role: 'COLLABORATOR' },
      update: {},
    });
    return { role: 'COLLABORATOR', loans: 0 };
  }, serializable);
}
