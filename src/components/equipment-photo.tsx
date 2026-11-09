'use client';

import { useState } from 'react';

export function EquipmentPhoto({ id, name }: { id: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const url = base && `${base}/storage/v1/object/public/catalogo-equipamentos/equipamentos/${id}.jpg`;
  return (
    <div className="equipment-photo">
      {url && !failed
        // The catalog serves its already resized photos directly from public Storage.
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={url} width={800} height={600} loading="lazy" alt={name} onError={() => setFailed(true)} />
        : <span className="muted">Foto indisponível</span>}
    </div>
  );
}
