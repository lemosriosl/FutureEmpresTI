import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { authEnv } from '@/env';

export function createAuthClient(
  read: () => { name: string; value: string }[],
  write: (values: { name: string; value: string; options: CookieOptions }[]) => void,
) {
  const env = authEnv();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
    cookies: { getAll: read, setAll: write },
  });
}

export async function createRouteAuthClient() {
  const jar = await cookies();
  return createAuthClient(() => jar.getAll(), (values) => {
    for (const { name, value, options } of values) jar.set(name, value, options);
  });
}
