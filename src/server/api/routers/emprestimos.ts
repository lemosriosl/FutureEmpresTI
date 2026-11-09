import { z } from 'zod';
import { patrimonioInput } from '@/lib/inputs';
import { router, tenantProcedure } from '@/server/api/trpc';
import { listMyLoans, requestLoan } from '@/server/services/loans';

export const emprestimosRouter = router({
  mine: tenantProcedure.input(z.void()).query(({ ctx }) => listMyLoans(ctx.db, ctx.access)),
  request: tenantProcedure.input(z.strictObject({ patrimonio: patrimonioInput }))
    .mutation(({ ctx, input }) => requestLoan(ctx.db, ctx.access, input.patrimonio)),
});
