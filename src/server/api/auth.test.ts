import { expect, test, vi } from 'vitest';
import { appRouter } from './root';
import type { createContext } from './trpc';

type Context = Awaited<ReturnType<typeof createContext>>;

const anonymousContext: Context = {
  auth: null as unknown as Context['auth'],
  db: null as unknown as Context['db'],
  membership: null,
  userId: null,
  requestId: 'teste',
};
const caller = appRouter.createCaller(anonymousContext);

test('CA-003-01 visitante não chama procedimentos de domínio', async () => {
  await expect(caller.equipamentos.list({})).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  await expect(caller.equipamentos.detail({ patrimonio: 'TI-TESTE' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  await expect(caller.emprestimos.mine()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  await expect(caller.emprestimos.request({ patrimonio: 'TI-TESTE' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
});

test('CA-003-01 login rejeita entradas inválidas antes da autenticação', async () => {
  await expect(caller.auth.login({ email: 'invalido', password: '' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
});

test('CA-003-01 aceita o login verificado de uma conta com vínculo único', async () => {
  const userId = '22da1c32-41db-4fb0-94f8-591a66b420f5';
  const credentials = { email: 'colaborador@example.test', password: 'senha-ficticia' };
  const signInWithPassword = vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null });
  const findMany = vi.fn().mockResolvedValue([{ tenantId: 'tenant-de-teste', role: 'COLLABORATOR' }]);
  const login = appRouter.createCaller({
    ...anonymousContext,
    auth: { auth: { signInWithPassword } } as unknown as Context['auth'],
    db: { membership: { findMany } } as unknown as Context['db'],
  }).auth.login;

  await expect(login(credentials)).resolves.toEqual({ success: true });
  expect(signInWithPassword).toHaveBeenCalledWith(credentials);
  expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId } }));
});
