'use client';

import Link from 'next/link';
import { formatDueDate, loanLimit } from '@/lib/emprestimos';
import { trpc } from '@/lib/trpc';

export function MyLoans() {
  const loans = trpc.emprestimos.mine.useQuery();
  return (
    <>
      <header className="page-heading">
        <h1>Meus empréstimos</h1>
        {loans.data && <p className="muted">{loans.data.length} de {loanLimit} itens com você</p>}
      </header>
      {loans.isPending && <p role="status">Carregando empréstimos…</p>}
      {loans.error && <p role="alert" className="danger">{loans.error.message}</p>}
      {loans.data?.length === 0 && <p className="muted">Você não tem empréstimos em aberto.</p>}
      {!!loans.data?.length && (
        <ul className="loan-list">
          {loans.data.map((loan) => (
            <li className="panel loan-row" key={loan.id}>
              <div>
                <Link href={`/catalogo/${encodeURIComponent(loan.equipment.patrimonio)}`}>{loan.equipment.name}</Link>
                <p className="muted">{loan.equipment.category} · {loan.equipment.patrimonio}</p>
              </div>
              <div>
                <p>Devolver até <time dateTime={loan.dueAt.toISOString()}>{formatDueDate(loan.dueAt)}</time></p>
                <p className={loan.overdue ? 'danger' : 'muted'}>{loan.overdue ? 'Em atraso' : 'No prazo'}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
