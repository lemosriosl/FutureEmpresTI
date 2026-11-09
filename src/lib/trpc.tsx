'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState, type ReactNode } from 'react';
import superjson from 'superjson';
import type { AppRouter } from '@/server/api/root';

export const trpc = createTRPCReact<AppRouter>();

export function AppProviders({ children }: { children: ReactNode }) {
  const [queries] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 15_000 } },
  }));
  const [client] = useState(() => trpc.createClient({
    links: [httpBatchLink({ url: '/api/trpc', transformer: superjson })],
  }));
  return (
    <trpc.Provider client={client} queryClient={queries}>
      <QueryClientProvider client={queries}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
