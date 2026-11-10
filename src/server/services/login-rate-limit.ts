import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import type { Prisma, PrismaClient } from '@prisma/client';

type Scope = 'ip' | 'account';
const limits = { account: 5, ip: 30 };

export function loginClientIp(headers: Headers, vercel: boolean) {
  if (!vercel) return 'local';
  const address = headers.get('x-vercel-forwarded-for')?.trim() ?? '';
  switch (isIP(address)) {
    case 4: return address;
    case 6: return new URL(`http://[${address}]`).hostname.slice(1, -1);
    default: return 'unknown';
  }
}

async function consume(
  tx: Prisma.TransactionClient, secret: string, scope: Scope, value: string,
) {
  const key = createHmac('sha256', secret).update(scope).update('\0').update(value).digest('hex');
  const rows = await tx.$queryRaw<{ attempts: number }[]>`
    INSERT INTO public.login_rate_limits AS limits (scope, key_hash, window_start, attempts)
    VALUES (${scope}, ${key}, CURRENT_TIMESTAMP, 1)
    ON CONFLICT (scope, key_hash) DO UPDATE
    SET window_start = CASE WHEN limits.window_start <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
                            THEN CURRENT_TIMESTAMP ELSE limits.window_start END,
        attempts = CASE WHEN limits.window_start <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
                        THEN 1 ELSE limits.attempts + 1 END
    WHERE limits.window_start <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
       OR limits.attempts < ${limits[scope]}
    RETURNING attempts
  `;
  return rows[0]?.attempts;
}

export async function consumeLoginAttempt(db: PrismaClient, secret: string, ip: string, email: string) {
  const { allowed, newIpWindow } = await db.$transaction(async (tx) => {
    const ipAttempts = await consume(tx, secret, 'ip', ip);
    if (!ipAttempts) return { allowed: false, newIpWindow: false };
    const accountAttempts = await consume(tx, secret, 'account', email.trim().toLowerCase());
    return { allowed: accountAttempts !== undefined, newIpWindow: ipAttempts === 1 };
  });

  if (newIpWindow) {
    try {
      await db.$executeRaw`
        DELETE FROM public.login_rate_limits
        WHERE (scope, key_hash) IN (
          SELECT scope, key_hash FROM public.login_rate_limits
          WHERE window_start <= CURRENT_TIMESTAMP - INTERVAL '1 day'
          ORDER BY window_start
          LIMIT 100
          FOR UPDATE SKIP LOCKED
        )
      `;
    } catch {
      console.warn('Não foi possível limpar contadores de login expirados.');
    }
  }
  return allowed;
}
