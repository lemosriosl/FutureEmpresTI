'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { loanLimit } from '@/lib/emprestimos';
import { trpc } from '@/lib/trpc';

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const loans = trpc.emprestimos.mine.useQuery();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      queryClient.clear();
      router.replace('/login');
      router.refresh();
    },
  });
  return (
    <aside className="app-nav">
      <Link className="brand" href="/catalogo"><span aria-hidden>+</span> EmpresTI</Link>
      <nav aria-label="Colaborador">
        <Link href="/catalogo" aria-current={pathname.startsWith('/catalogo') ? 'page' : undefined}>Catálogo</Link>
        <Link href="/meus-emprestimos" aria-current={pathname === '/meus-emprestimos' ? 'page' : undefined}>Meus empréstimos</Link>
      </nav>
      {loans.data && <p className="muted">{loans.data.length} de {loanLimit} itens com você</p>}
      <button className="button" type="button" disabled={logout.isPending} onClick={() => logout.mutate()}>Sair</button>
      {logout.error && <p role="alert" className="danger">{logout.error.message}</p>}
    </aside>
  );
}
