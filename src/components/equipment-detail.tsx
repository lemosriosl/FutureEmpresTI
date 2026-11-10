'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { dueDate, formatDueDate, loanBusinessDays, loanLimit } from '@/lib/emprestimos';
import { trpc } from '@/lib/trpc';
import { EquipmentStatus } from './catalogo';
import { EquipmentPhoto } from './equipment-photo';

export function EquipmentDetail({ patrimonio }: { patrimonio: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const utils = trpc.useUtils();
  const detail = trpc.equipamentos.detail.useQuery({ patrimonio });
  const loans = trpc.emprestimos.mine.useQuery();
  const request = trpc.emprestimos.request.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.equipamentos.invalidate(), utils.emprestimos.mine.invalidate()]);
      router.push('/meus-emprestimos');
    },
    onError: () => Promise.all([utils.equipamentos.invalidate(), utils.emprestimos.mine.invalidate()]),
  });

  if (detail.isPending) return <p role="status">Carregando equipamento…</p>;
  if (detail.error) return <p role="alert" className="danger">{detail.error.message}</p>;
  const item = detail.data;
  const count = loans.data?.length;
  const overdue = loans.data?.some((loan) => loan.overdue);
  let reason: string | undefined;
  if (item.status !== 'AVAILABLE') reason = 'Este equipamento está indisponível.';
  else if (overdue) reason = 'Devolva o item em atraso antes de solicitar outro.';
  else if (count !== undefined && count >= loanLimit) reason = `Você já atingiu o limite de ${loanLimit} empréstimos em aberto.`;

  return (
    <>
      <Link className="muted" href="/catalogo">← Catálogo</Link>
      <header className="page-heading">
        <p className="muted">{item.category} · {item.patrimonio}</p>
        <h1>{item.name}</h1>
        <EquipmentStatus status={item.status} />
      </header>
      <div className="detail-grid">
        <section className="panel card-content loan-request">
          <h2>Solicitar empréstimo</h2>
          {item.location && <p>Retirada: {item.location}</p>}
          <p>Prazo: {loanBusinessDays} dias úteis</p>
          {count !== undefined && <p className="muted">{count} de {loanLimit} itens com você</p>}
          <button className="button primary" type="button" disabled={!!reason || count === undefined} onClick={() => {
            request.reset();
            dialog.current?.showModal();
          }}>{!reason && loans.isPending ? 'Verificando seus empréstimos…' : 'Solicitar empréstimo'}</button>
          {reason && <p className="muted">{reason}</p>}
          {loans.error && <p role="alert" className="danger">{loans.error.message}</p>}
        </section>
        <EquipmentPhoto key={item.id} id={item.id} name={item.name} />
      </div>
      <dialog className="panel confirm" ref={dialog} aria-labelledby="confirm-heading">
        <h2 id="confirm-heading">Confirmar empréstimo</h2>
        <p>{item.name}</p>
        <p>Previsão de devolução: {formatDueDate(dueDate(new Date()))}</p>
        {count === loanLimit - 1 && <p className="muted">Este pedido atingirá o limite de {loanLimit} empréstimos em aberto.</p>}
        {request.error && <p role="alert" className="danger">{request.error.message}</p>}
        <div className="actions">
          <button type="button" className="button" disabled={request.isPending} onClick={() => dialog.current?.close()}>Fechar</button>
          <button type="button" className="button primary" disabled={request.isPending || !!reason} onClick={() => request.mutate({ patrimonio })}>
            {request.isPending ? 'Confirmando…' : 'Confirmar'}
          </button>
        </div>
      </dialog>
    </>
  );
}
