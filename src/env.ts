import { z } from 'zod';

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ protocol: /^https?$/ }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const databaseSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(?:ql)?$/ }),
  DIRECT_URL: z.url({ protocol: /^postgres(?:ql)?$/ }),
});

export function authEnv() {
  return publicSchema.parse(process.env);
}

export function validateDatabaseEnv() {
  databaseSchema.parse(process.env);
}
