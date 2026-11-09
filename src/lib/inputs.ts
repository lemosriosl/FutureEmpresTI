import { z } from 'zod';

export const loginInput = z.strictObject({
  email: z.string().trim().max(254).pipe(z.email()),
  password: z.string().min(1).max(1024),
});

export const patrimonioInput = z.string().trim().min(1).max(80);
