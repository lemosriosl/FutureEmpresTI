import { expect, test, vi } from 'vitest';
import { consumeLoginAttempt, loginClientIp } from '@/server/services/login-rate-limit';
import { appRouter } from './root';
import type { createContext } from './trpc';

type Context = Awaited<ReturnType<typeof createContext>>;

vi.mock('@/env', async (original) => ({
  ...await original<typeof import('@/env')>(),
  loginRateLimitEnv: () => ({ LOGIN_RATE_LIMIT_SECRET: 'ficticio-apenas-para-teste-unitario' }),
}));
vi.mock('@/server/services/login-rate-limit', async (original) => ({
  ...await original<typeof import('@/server/services/login-rate-limit')>(),
  consumeLoginAttempt: vi.fn().mockResolvedValue(true),
}));

const anonymousContext: Context = {
  auth: null as unknown as Context['auth'],
  db: null as unknown as Context['db'],
  membership: null,
  userId: null,
  clientIp: 'local',
  requestId: 'teste',
};
const caller = appRouter.createCaller(anonymousContext);

test('CA-003-01 visitante não chama procedimentos de domínio', async () => {
  await expect(caller.equipamentos.list({})).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  await expect(caller.equipamentos.detail({ patrimonio: 'TI-TESTE' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  await expect(caller.emprestimos.mine()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  await expect(caller.emprestimos.request({ patrimonio: 'TI-TESTE' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
});

test('CA-003-07 login bloqueado não chama o Supabase Auth', async () => {
  vi.mocked(consumeLoginAttempt).mockResolvedValueOnce(false);
  const signInWithPassword = vi.fn();
  const login = appRouter.createCaller({
    ...anonymousContext,
    auth: { auth: { signInWithPassword } } as unknown as Context['auth'],
  }).auth.login;

  await expect(login({ email: 'conta@example.test', password: 'ficticia' }))
    .rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
  expect(signInWithPassword).not.toHaveBeenCalled();
});

test('CA-003-07 só confia no cabeçalho de IP da Vercel em ambiente Vercel', () => {
  const headers = new Headers({
    'x-forwarded-for': '192.0.2.10',
    'x-vercel-forwarded-for': '2001:0db8:0000::1',
  });
  expect(loginClientIp(headers, true)).toBe('2001:db8::1');
  expect(loginClientIp(headers, false)).toBe('local');
  headers.delete('x-vercel-forwarded-for');
  expect(loginClientIp(headers, true)).toBe('unknown');
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
