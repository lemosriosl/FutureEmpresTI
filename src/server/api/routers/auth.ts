import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { loginInput } from '@/lib/inputs';
import { publicProcedure, router } from '@/server/api/trpc';
import { resolveMembership } from '@/server/tenant';

export const authRouter = router({
  login: publicProcedure.input(loginInput).mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.auth.auth.signInWithPassword(input);
    if (error?.status === 429) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Aguarde e tente entrar novamente.' });
    if (error && (!error.status || error.status >= 500)) {
      throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'O serviço de login está indisponível. Tente novamente.' });
    }
    if (error || !data.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'E-mail ou senha inválidos.' });

    const membership = await resolveMembership(ctx.db, data.user.id);
    if (!membership) {
      await ctx.auth.auth.signOut({ scope: 'local' });
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Seu acesso a este catálogo não está ativo.' });
    }
    return { success: true };
  }),
  logout: publicProcedure.input(z.void()).mutation(async ({ ctx }) => {
    const { error } = await ctx.auth.auth.signOut({ scope: 'local' });
    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    return { success: true };
  }),
});
