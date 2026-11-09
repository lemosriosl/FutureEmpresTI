import { Prisma, PrismaClient } from '@prisma/client';
import { Entrega3Error, linkEntrega3Professor, loadEntrega3Catalog } from './entrega3';

const [action, email, ...extra] = process.argv.slice(2);
const catalogAction = action === '--catalogo' && email === undefined;
const professorAction = action === '--professor' && !!email?.trim() && !extra.length;

if (!catalogAction && !professorAction) {
  console.error('Use --catalogo ou --professor com o e-mail da conta confirmada.');
  process.exitCode = 1;
} else {
  const db = new PrismaClient();
  try {
    const result = catalogAction
      ? await loadEntrega3Catalog(db)
      : await linkEntrega3Professor(db, email.trim());
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof Entrega3Error) console.error(error.message);
    else if (error instanceof Prisma.PrismaClientKnownRequestError) console.error(`Falha na carga (${error.code}).`);
    else console.error('Falha na carga. Confira a configuração local da conexão.');
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}
