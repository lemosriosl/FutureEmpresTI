import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { router } from './trpc';
import { authRouter } from './routers/auth';
import { equipamentosRouter } from './routers/equipamentos';
import { emprestimosRouter } from './routers/emprestimos';

export const appRouter = router({
  auth: authRouter,
  equipamentos: equipamentosRouter,
  emprestimos: emprestimosRouter,
});

export type AppRouter = typeof appRouter;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
