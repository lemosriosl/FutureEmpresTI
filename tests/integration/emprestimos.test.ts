import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { appRouter } from '@/server/api/root';
import type { createContext } from '@/server/api/trpc';
import { dueDate } from '@/lib/emprestimos';
import { consumeLoginAttempt } from '@/server/services/login-rate-limit';
import { linkEntrega3Professor, loadEntrega3Catalog } from '../../prisma/entrega3';
import { testPostgres } from '../fixtures/postgres';

type Context = Awaited<ReturnType<typeof createContext>>;
let container: StartedPostgreSqlContainer | undefined;
let db: PrismaClient;

beforeAll(async () => {
  container = await (await testPostgres()).start();
  db = new PrismaClient({ datasourceUrl: container.getConnectionUri() });
});

afterAll(async () => {
  await db?.$disconnect();
  await container?.stop();
});

async function fixture() {
  const { id: tenantId } = await db.tenant.create({
    data: { name: 'Tenant do teste', slug: randomUUID() },
  });
  const userId = randomUUID();
  await db.membership.create({ data: { tenantId, userId, role: 'COLLABORATOR' } });
  const caller = appRouter.createCaller({
    auth: null as unknown as Context['auth'],
    db,
    userId,
    membership: { tenantId, role: 'COLLABORATOR' },
    clientIp: 'local',
    requestId: randomUUID(),
  });

  function equipment(patrimonio: string, status: 'AVAILABLE' | 'MAINTENANCE' = 'AVAILABLE') {
    return db.equipment.create({
      data: { tenantId, patrimonio, name: patrimonio, category: 'Teste', status },
    });
  }

  async function loan(patrimonio: string, overdue = false, returned = false) {
    const { id: equipmentId } = await equipment(patrimonio);
    const borrowedAt = new Date('2026-04-02T14:00:00Z');
    const dueAt = overdue ? borrowedAt : new Date(Date.now() + 86_400_000);
    return db.loan.create({
      data: { tenantId, borrowerId: userId, equipmentId, borrowedAt, dueAt, returnedAt: returned ? dueAt : null },
    });
  }

  return { tenantId, caller, equipment, loan };
}

test('CA-003-02 catálogo distingue manutenção e empréstimo de disponibilidade', async () => {
  const { caller, equipment, loan } = await fixture();
  await equipment('TESTE-1');
  await equipment('TESTE-2', 'MAINTENANCE');
  await loan('TESTE-3');
  expect((await caller.equipamentos.list({ direction: 'forward' })).items.map((item) => item.status))
    .toEqual(['AVAILABLE', 'MAINTENANCE', 'BORROWED']);
  expect((await caller.equipamentos.list({ direction: 'forward', availableOnly: true })).items.map((item) => item.patrimonio))
    .toEqual(['TESTE-1']);
});

test('CA-003-07 cota por conta é atômica sob concorrência e volta após a janela', async () => {
  const secret = randomUUID();
  const attempts = await Promise.all(Array.from({ length: 10 }, (_, index) =>
    consumeLoginAttempt(db, secret, `ip-${index}`, index % 2 ? 'Teste@conta.test' : 'teste@conta.test')));
  expect(attempts.filter(Boolean)).toHaveLength(5);
  expect(await consumeLoginAttempt(db, secret, 'ip-extra', 'teste@conta.test')).toBe(false);
  await db.$executeRaw`
    UPDATE public.login_rate_limits SET window_start = CURRENT_TIMESTAMP - INTERVAL '16 minutes'
    WHERE scope = 'account'
  `;
  expect(await consumeLoginAttempt(db, secret, 'ip-extra', 'teste@conta.test')).toBe(true);
});

test('CA-003-07 cota por IP independe da conta e roles da API não acessam os contadores', async () => {
  const secret = randomUUID();
  for (let i = 0; i < 30; i++) {
    expect(await consumeLoginAttempt(db, secret, 'ip-teste', `conta-${i}@teste.test`)).toBe(true);
  }
  expect(await consumeLoginAttempt(db, secret, 'ip-teste', 'nova@teste.test')).toBe(false);
  expect(await consumeLoginAttempt(db, secret, 'outro-ip', 'nova@teste.test')).toBe(true);
  const access = await db.$queryRaw<{ role: string; rls: boolean; canRead: boolean; canWrite: boolean }[]>`
    SELECT role, relrowsecurity AS rls,
      has_table_privilege(role, 'public.login_rate_limits', 'SELECT') AS "canRead",
      has_table_privilege(role, 'public.login_rate_limits', 'INSERT,UPDATE,DELETE') AS "canWrite"
    FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS roles(role)
    CROSS JOIN pg_class
    WHERE oid = 'public.login_rate_limits'::regclass
  `;
  expect(access).toEqual(['anon', 'authenticated', 'service_role'].map((role) =>
    ({ role, rls: true, canRead: false, canWrite: false })));
});

test('CA-003-03 persiste o vencimento e lista apenas os próprios empréstimos em aberto', async () => {
  const { tenantId, caller, equipment, loan } = await fixture();
  await loan('DEVOLVIDO', false, true);
  const otherUser = randomUUID();
  await db.membership.create({ data: { tenantId, userId: otherUser, role: 'COLLABORATOR' } });
  const { id: otherEquipment } = await equipment('OUTRA-PESSOA');
  await db.loan.create({
    data: { tenantId, borrowerId: otherUser, equipmentId: otherEquipment, dueAt: dueDate(new Date()) },
  });
  await equipment('LIVRE');
  const result = await caller.emprestimos.request({ patrimonio: 'LIVRE' });
  const saved = await db.loan.findUniqueOrThrow({ where: { id: result.id, tenantId } });
  expect(result.dueAt).toEqual(dueDate(saved.borrowedAt));
  expect((await caller.emprestimos.mine()).map((item) => item.id)).toEqual([result.id]);
  expect(await db.auditLog.count({ where: { tenantId, resourceId: result.id } })).toBe(1);
});

test('CA-003-04 o quinto empréstimo passa e manutenção, atraso e sexto empréstimo são rejeitados', async () => {
  const { caller, equipment, loan } = await fixture();
  await equipment('LIVRE');
  await equipment('OUTRO-LIVRE');
  await equipment('MANUTENCAO', 'MAINTENANCE');
  await expect(caller.emprestimos.request({ patrimonio: 'MANUTENCAO' })).rejects.toMatchObject({ code: 'CONFLICT' });
  for (const patrimonio of ['L1', 'L2', 'L3', 'L4']) await loan(patrimonio);
  await expect(caller.emprestimos.request({ patrimonio: 'LIVRE' })).resolves.toMatchObject({ id: expect.any(String) });
  await expect(caller.emprestimos.request({ patrimonio: 'OUTRO-LIVRE' })).rejects.toThrow(/limite de 5/);

  const other = await fixture();
  await other.equipment('LIVRE');
  await other.loan('ATRASADO', true);
  await expect(other.caller.emprestimos.request({ patrimonio: 'LIVRE' })).rejects.toThrow(/atraso/);
});

test('CA-003-05 um único pedido concorrente para o mesmo equipamento passa', async () => {
  const { caller, equipment, tenantId } = await fixture();
  const { id: equipmentId } = await equipment('LIVRE');
  const outcomes = await Promise.allSettled([
    caller.emprestimos.request({ patrimonio: 'LIVRE' }),
    caller.emprestimos.request({ patrimonio: 'LIVRE' }),
  ]);
  expect(outcomes.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
  expect(await db.loan.count({ where: { tenantId, equipmentId, returnedAt: null } })).toBe(1);
});

test('CA-003-05 dois itens concorrentes não ultrapassam o limite por pessoa', async () => {
  const { caller, equipment, loan, tenantId } = await fixture();
  for (const patrimonio of ['L1', 'L2', 'L3', 'L4']) await loan(patrimonio);
  await equipment('L5');
  await equipment('L6');
  const outcomes = await Promise.allSettled([
    caller.emprestimos.request({ patrimonio: 'L5' }),
    caller.emprestimos.request({ patrimonio: 'L6' }),
  ]);
  expect(outcomes.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
  expect(await db.loan.count({ where: { tenantId, returnedAt: null } })).toBe(5);
});

test('CA-003-06 cada procedimento de domínio respeita o tenant da sessão', async () => {
  const a = await fixture();
  const b = await fixture();
  await a.equipment('ITEM-A');
  await b.equipment('ITEM-B');
  await b.loan('EMPRESTADO-B');
  expect((await a.caller.equipamentos.list({})).items.map((item) => item.patrimonio)).toEqual(['ITEM-A']);
  await expect(a.caller.equipamentos.detail({ patrimonio: 'ITEM-B' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  await expect(a.caller.emprestimos.request({ patrimonio: 'ITEM-B' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  expect(await a.caller.emprestimos.mine()).toEqual([]);
  await expect(a.caller.equipamentos.list({ tenantId: b.tenantId } as never)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
});

test('CA-002-01 CA-002-02 CA-002-03 carga repetível preserva histórico, estado e papéis', async () => {
  const { id: tenantId } = await db.tenant.create({ data: { name: 'Suporte TI', slug: 'suporte_ti' } });
  const adminId = randomUUID();
  const professorId = randomUUID();
  const email = 'professor@example.test';
  await db.membership.create({ data: { tenantId, userId: adminId, role: 'ADMIN' } });
  await db.$executeRaw`INSERT INTO auth.users (id, email, email_confirmed_at) VALUES (${professorId}::uuid, ${email}, now())`;
  const legacy = ['NB-001', 'NB-002', 'MON-001', 'CAB-001', 'CAM-001'];
  await db.equipment.createMany({ data: legacy.map((patrimonio) => ({ tenantId, patrimonio, name: patrimonio, category: 'demo' })) });
  const historicalItem = await db.equipment.findUniqueOrThrow({ where: { tenantId_patrimonio: { tenantId, patrimonio: 'NB-001' } } });
  const history = await db.loan.create({
    data: { tenantId, borrowerId: adminId, equipmentId: historicalItem.id, dueAt: new Date(), returnedAt: new Date() },
  });
  const otherTenant = await fixture();
  const unrelated = await otherTenant.equipment('NB-001');

  const first = await loadEntrega3Catalog(db);
  expect(first.newlyRetired).toBe(5);
  expect(first.catalog).toHaveLength(12);
  expect(first.catalog.filter(({ status }) => status === 'MAINTENANCE').map(({ patrimonio }) => patrimonio))
    .toEqual(['TI-0004', 'TI-0007']);
  expect(first.catalog.find(({ patrimonio }) => patrimonio === 'TI-0010')?.status).toBe('AVAILABLE');
  expect(await linkEntrega3Professor(db, email)).toEqual({ role: 'COLLABORATOR', loans: 0 });

  const caller = appRouter.createCaller({
    auth: null as unknown as Context['auth'],
    db,
    userId: adminId,
    membership: { tenantId, role: 'ADMIN' },
    clientIp: 'local',
    requestId: randomUUID(),
  });
  const open = await caller.emprestimos.request({ patrimonio: 'TI-0001' });
  await db.equipment.update({
    where: { tenantId_patrimonio: { tenantId, patrimonio: 'TI-0002' } },
    data: { status: 'MAINTENANCE' },
  });
  const repeated = await loadEntrega3Catalog(db);
  expect(repeated.newlyRetired).toBe(0);
  expect(repeated.catalog.map(({ id }) => id)).toEqual(first.catalog.map(({ id }) => id));
  expect(repeated.catalog.find(({ patrimonio }) => patrimonio === 'TI-0002')?.status).toBe('MAINTENANCE');
  expect(await linkEntrega3Professor(db, email)).toEqual({ role: 'COLLABORATOR', loans: 0 });
  expect(await db.membership.count({ where: { tenantId } })).toBe(2);
  expect(await db.membership.findUnique({ where: { userId_tenantId: { userId: adminId, tenantId } } }))
    .toMatchObject({ role: 'ADMIN' });
  expect(await db.loan.count({ where: { tenantId, borrowerId: professorId } })).toBe(0);
  expect(await db.loan.findUnique({ where: { id: history.id, tenantId } })).toMatchObject({ returnedAt: history.returnedAt });
  expect(await db.loan.findUnique({ where: { id: open.id, tenantId } })).toMatchObject({ returnedAt: null });
  expect(await db.equipment.findUnique({ where: { id: unrelated.id, tenantId: otherTenant.tenantId } }))
    .toMatchObject({ status: 'AVAILABLE' });
  expect((await caller.equipamentos.list({})).items).toHaveLength(12);
  await expect(caller.equipamentos.detail({ patrimonio: 'NB-001' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
});
