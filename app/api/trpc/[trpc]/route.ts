import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { NextRequest } from 'next/server';
import { appRouter } from '@/server/api/root';
import { createContext } from '@/server/api/trpc';

async function handler(req: NextRequest) {
  const host = req.headers.get('host');
  if (req.method === 'POST' && (!host || req.headers.get('origin') !== `${req.nextUrl.protocol}//${host}`)) {
    return new Response(null, { status: 403, headers: { 'Cache-Control': 'private, no-store' } });
  }

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    responseMeta: () => ({ headers: new Headers({ 'Cache-Control': 'private, no-store' }) }),
    onError: ({ ctx, error, path }) => {
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        console.error(JSON.stringify({ request_id: ctx?.requestId, tenant_id: ctx?.membership?.tenantId, path, code: error.code }));
      }
    },
  });
}

export { handler as GET, handler as POST };
