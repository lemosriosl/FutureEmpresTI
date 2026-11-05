import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'suporte_ti' },
    update: { name: 'Suporte TI' },
    create: { slug: 'suporte_ti', name: 'Suporte TI' },
  });

  const equipmentData = [
    {
      patrimonio: 'NB-001',
      name: 'Notebook Dell Latitude 5440',
      category: 'Notebook',
      serialNumber: 'DL5440-001',
      location: 'Armário A1',
      status: 'AVAILABLE' as const,
    },
    {
      patrimonio: 'NB-002',
      name: 'Notebook Lenovo ThinkPad E14',
      category: 'Notebook',
      serialNumber: 'LNE14-002',
      location: 'Armário A1',
      status: 'AVAILABLE' as const,
    },
    {
      patrimonio: 'MON-001',
      name: 'Monitor LG 24 polegadas',
      category: 'Monitor',
      serialNumber: 'LG24-001',
      location: 'Estante B2',
      status: 'AVAILABLE' as const,
    },
    {
      patrimonio: 'CAB-001',
      name: 'Kit de cabos USB-C e HDMI',
      category: 'Cabo',
      serialNumber: null,
      location: 'Gaveta C1',
      status: 'AVAILABLE' as const,
    },
    {
      patrimonio: 'CAM-001',
      name: 'Câmera Logitech C920',
      category: 'Câmera',
      serialNumber: 'LOGC920-001',
      location: 'Estante B3',
      status: 'MAINTENANCE' as const,
      notes: 'Aguardando troca do cabo USB.',
    },
  ];

  const equipment: Array<{ id: string; patrimonio: string }> = [];
  for (const data of equipmentData) {
    const item = await prisma.equipment.upsert({
      where: {
        tenantId_patrimonio: {
          tenantId: tenant.id,
          patrimonio: data.patrimonio,
        },
      },
      update: data,
      create: { ...data, tenantId: tenant.id },
    });
    equipment.push(item);

    const existingLog = await prisma.auditLog.findFirst({
      where: {
        tenantId: tenant.id,
        action: 'SEED_EQUIPMENT',
        resourceType: 'Equipment',
        resourceId: item.id,
      },
    });
    if (!existingLog) {
      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          action: 'SEED_EQUIPMENT',
          resourceType: 'Equipment',
          resourceId: item.id,
          metadata: { patrimonio: item.patrimonio },
        },
      });
    }
  }

  const authSchema = await prisma.$queryRaw<Array<{ tableName: string | null }>>`
    SELECT to_regclass('auth.users')::text AS "tableName"
  `;
  const authUsers = authSchema[0]?.tableName
    ? await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id::text AS id
        FROM auth.users
        ORDER BY created_at
        LIMIT 10
      `
    : [];

  for (const [index, user] of authUsers.entries()) {
    await prisma.membership.upsert({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: tenant.id,
        },
      },
      update: { role: index === 0 ? 'ADMIN' : 'COLLABORATOR' },
      create: {
        userId: user.id,
        tenantId: tenant.id,
        role: index === 0 ? 'ADMIN' : 'COLLABORATOR',
      },
    });
  }

  if (authUsers.length > 0) {
    const borrowerId = authUsers[0].id;
    const historicalEquipment = equipment[0];
    const openEquipment = equipment[1];
    const now = new Date();

    const historicalLoan = await prisma.loan.findFirst({
      where: {
        tenantId: tenant.id,
        equipmentId: historicalEquipment.id,
        borrowerId,
        returnedAt: { not: null },
      },
    });
    if (!historicalLoan) {
      await prisma.loan.create({
        data: {
          tenantId: tenant.id,
          equipmentId: historicalEquipment.id,
          borrowerId,
          borrowedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          dueAt: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000),
          returnedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const openLoan = await prisma.loan.findFirst({
      where: { equipmentId: openEquipment.id, returnedAt: null },
    });
    if (!openLoan) {
      await prisma.loan.create({
        data: {
          tenantId: tenant.id,
          equipmentId: openEquipment.id,
          borrowerId,
          borrowedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          dueAt: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  const tenantLog = await prisma.auditLog.findFirst({
    where: {
      tenantId: tenant.id,
      action: 'SEED_DATA',
      resourceType: 'Tenant',
      resourceId: tenant.id,
    },
  });
  if (!tenantLog) {
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: 'SEED_DATA',
        resourceType: 'Tenant',
        resourceId: tenant.id,
        metadata: {
          equipmentCount: equipment.length,
          authUserCount: authUsers.length,
        },
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
