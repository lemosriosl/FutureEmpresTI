import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { createRouteAuthClient } from '@/lib/supabase/server';
import { getPrisma } from '@/server/db';
import { loginClientIp } from '@/server/services/login-rate-limit';
import { resolveMembership } from '@/server/tenant';

export async function createContext(request: Request) {
  const auth = await createRouteAuthClient();
  const { data } = await auth.auth.getUser();
  const userId = data.user?.id ?? null;
  const db = getPrisma();
  return {
    auth,
    db,
    userId,
    membership: userId ? await resolveMembership(db, userId) : null,
    clientIp: loginClientIp(request.headers, process.env.VERCEL === '1'),
    requestId: crypto.randomUUID(),
  };
}

const t = initTRPC.context<Awaited<ReturnType<typeof createContext>>>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      message: error.code === 'INTERNAL_SERVER_ERROR' ? 'O serviço está indisponível. Tente novamente.' : shape.message,
      data: { ...shape.data, stack: undefined },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Entre para continuar.' });
  return next({ ctx: { userId: ctx.userId } });
});
export const tenantProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.membership) throw new TRPCError({ code: 'FORBIDDEN', message: 'Seu acesso a este catálogo não está ativo.' });
  return next({ ctx: { access: { tenantId: ctx.membership.tenantId, userId: ctx.userId } } });
});
