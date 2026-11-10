import { z } from 'zod';

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ protocol: /^https?$/ }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const databaseSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(?:ql)?$/ }),
  DIRECT_URL: z.url({ protocol: /^postgres(?:ql)?$/ }),
});

const loginRateLimitSchema = z.object({
  LOGIN_RATE_LIMIT_SECRET: z.string().min(32),
});

export function authEnv() {
  return publicSchema.parse(process.env);
}

export function validateDatabaseEnv() {
  databaseSchema.parse(process.env);
}

export function loginRateLimitEnv() {
  return loginRateLimitSchema.parse(process.env);
}
