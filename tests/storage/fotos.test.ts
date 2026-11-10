import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { chromium } from '@playwright/test';
import { entrega3Patrimonios } from '../../prisma/entrega3';

const row = /^\| `(TI-\d{4})` \| `\1\.jpg` \| \[(\d+)\]\(https:\/\/pixabay\.com\/photos\/[^)]+\) \| ([^|]+) \| `(equipamentos\/[\da-f-]{36}\.jpg)` \|$/gm;
const publishedHash = /^- `(TI-\d{4})` · `([a-f0-9]{64})`$/gm;

test('CA-002-04 manifesto e 12 JPEGs públicos distintos de 800×600', async () => {
  const manifest = await readFile(new URL('../../spec/entrega3-fotos.md', import.meta.url), 'utf8');
  const entries = Array.from(manifest.replaceAll('\r\n', '\n').matchAll(row));
  assert.deepEqual(entries.map(([, asset]) => asset).sort(), [...entrega3Patrimonios].sort());
  assert.equal(new Set(entries.map(([, , id]) => id)).size, entries.length);
  assert.equal(new Set(entries.map(([, , , , key]) => key)).size, entries.length);
  assert.ok(entries.every(([, , , author]) => author.trim()));
  assert.match(manifest, /https:\/\/pixabay\.com\/service\/license-summary\//);
  assert.match(manifest, /Revisão de \d{2}\/\d{2}\/\d{4}/);
  const replacementHashes = new Map(Array.from(manifest.replaceAll('\r\n', '\n').matchAll(publishedHash), ([, asset, hash]) => [asset, hash]));
  assert.deepEqual([...replacementHashes.keys()].sort(), ['TI-0011', 'TI-0012']);

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  assert.ok(base, 'Informe somente a URL pública em NEXT_PUBLIC_SUPABASE_URL.');
  const origin = new URL(base);
  assert.ok(origin.protocol === 'https:' && origin.pathname === '/' &&
    !origin.username && !origin.password && !origin.search && !origin.hash,
  'Use uma origem HTTPS pública sem credenciais.');

  const photos = await Promise.all(entries.map(async ([, asset, , , key]) => {
    const url = new URL(`/storage/v1/object/public/catalogo-equipamentos/${key}`, origin);
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15_000) });
    assert.equal(response.status, 200, asset);
    assert.match(response.headers.get('content-type') ?? '', /^image\/jpeg(?:;|$)/i, asset);
    return { asset, bytes: Buffer.from(await response.arrayBuffer()) };
  }));
  const hashes = new Map(photos.map(({ asset, bytes }) => [asset, createHash('sha256').update(bytes).digest('hex')]));
  assert.equal(new Set(hashes.values()).size, entries.length, 'Dois patrimônios têm o mesmo arquivo.');
  for (const [asset, hash] of replacementHashes) assert.equal(hashes.get(asset), hash, asset);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const { asset, bytes } of photos) {
      assert.equal(bytes.subarray(0, 2).toString('hex'), 'ffd8', asset);
      const dimensions = await page.evaluate(async (data) => {
        const image = new Image();
        image.src = `data:image/jpeg;base64,${data}`;
        await image.decode();
        return [image.naturalWidth, image.naturalHeight];
      }, bytes.toString('base64'));
      assert.deepEqual(dimensions, [800, 600], asset);
    }
  } finally {
    await browser.close();
  }
});
