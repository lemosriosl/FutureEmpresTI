import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.tenant.upsert({
    where: { slug: 'suporte_ti' },
    update: { name: 'Suporte TI' },
    create: { slug: 'suporte_ti', name: 'Suporte TI' },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
