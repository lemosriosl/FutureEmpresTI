import { z } from 'zod';
import { patrimonioInput } from '@/lib/inputs';
import { router, tenantProcedure } from '@/server/api/trpc';
import { getEquipment, listEquipment } from '@/server/services/equipment';

export const equipamentosRouter = router({
  list: tenantProcedure.input(z.strictObject({
    cursor: patrimonioInput.optional(),
    direction: z.literal('forward').optional(),
    availableOnly: z.boolean().optional(),
  })).query(({ ctx, input }) => listEquipment(ctx.db, ctx.access, input)),
  detail: tenantProcedure.input(z.strictObject({ patrimonio: patrimonioInput }))
    .query(({ ctx, input }) => getEquipment(ctx.db, ctx.access, input.patrimonio)),
});
