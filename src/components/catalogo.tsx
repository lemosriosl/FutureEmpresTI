'use client';

import Link from 'next/link';
import { useState } from 'react';
import { loanBusinessDays, loanLimit } from '@/lib/emprestimos';
import { trpc } from '@/lib/trpc';
import type { RouterOutputs } from '@/server/api/root';
import { EquipmentPhoto } from './equipment-photo';

type Status = RouterOutputs['equipamentos']['detail']['status'];
const statusLabels: Record<Status, string> = {
  AVAILABLE: 'Disponível',
  BORROWED: 'Emprestado',
  MAINTENANCE: 'Em manutenção',
  OUT_OF_SERVICE: 'Fora de uso',
};

export function EquipmentStatus({ status }: { status: Status }) {
  return <span className="status" data-status={status}>{statusLabels[status]}</span>;
}

export function Catalogo() {
  const [availableOnly, setAvailableOnly] = useState(false);
  const catalog = trpc.equipamentos.list.useInfiniteQuery({ availableOnly }, {
    getNextPageParam: (last) => last.nextCursor,
  });
  const items = catalog.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <>
      <header className="page-heading"><h1>Catálogo</h1><p className="muted">Encontre o equipamento para o seu próximo trabalho.</p></header>
      <p className="notice">Até {loanLimit} itens · {loanBusinessDays} dias úteis · Empréstimos em atraso impedem novas solicitações.</p>
      <label className="filter"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} /> Só disponíveis</label>
      {catalog.isPending && <p role="status">Carregando catálogo…</p>}
      {catalog.error && <p role="alert" className="danger">{catalog.error.message}</p>}
      {catalog.isSuccess && items.length === 0 && <p className="muted">Nenhum equipamento encontrado.</p>}
      <div className="equipment-grid">
        {items.map((item) => (
          <Link className="panel equipment-card" key={item.id} href={`/catalogo/${encodeURIComponent(item.patrimonio)}`}>
            <EquipmentPhoto id={item.id} name={item.name} />
            <div className="card-content">
              <p className="muted">{item.category} · {item.patrimonio}</p>
              <h2>{item.name}</h2>
              <EquipmentStatus status={item.status} />
            </div>
          </Link>
        ))}
      </div>
      {catalog.hasNextPage && <button className="button" type="button" disabled={catalog.isFetchingNextPage} onClick={() => catalog.fetchNextPage()}>Ver mais</button>}
    </>
  );
}
