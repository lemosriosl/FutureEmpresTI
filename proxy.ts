import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/server';
import { authEnv } from '@/env';

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const storage = new URL(authEnv().NEXT_PUBLIC_SUPABASE_URL).origin;
  const devScript = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '';
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${devScript}`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' data: ${storage}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  const headers = new Headers(request.headers);
  headers.set('Content-Security-Policy', policy);

  const response = NextResponse.next({ request: { headers } });
  if (request.nextUrl.pathname !== '/login') {
    const auth = createAuthClient(() => request.cookies.getAll(), (values) => {
      for (const { name, value, options } of values) {
        response.cookies.set(name, value, options);
      }
    });
    const { data } = await auth.auth.getUser();
    if (!data.user) {
      const redirect = NextResponse.redirect(new URL('/login', request.url));
      for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
      redirect.headers.set('Cache-Control', 'private, no-store');
      return redirect;
    }
  }

  response.headers.set('Content-Security-Policy', policy);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = { matcher: ['/login', '/catalogo/:path*', '/meus-emprestimos'] };
