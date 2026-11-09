import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { text } from 'node:stream/consumers';
import { fileURLToPath } from 'node:url';

const umDia = 24 * 60 * 60 * 1000;
const cacheDir = fileURLToPath(new URL('../../../.cache/pixabay/', import.meta.url));

async function lerCache(caminho) {
  try {
    const { mtimeMs } = await stat(caminho);
    if (Date.now() - mtimeMs >= umDia) return null;

    const dados = JSON.parse(await readFile(caminho, 'utf8'));
    return Array.isArray(dados?.hits) ? dados : null;
  } catch (erro) {
    if (erro.code === 'ENOENT' || erro instanceof SyntaxError) return null;
    throw new Error('Não foi possível ler o cache local do Pixabay.');
  }
}

async function gravarCache(caminho, dados) {
  await mkdir(cacheDir, { recursive: true });
  const temporario = `${caminho}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporario, JSON.stringify(dados), { flag: 'wx' });
    await rename(temporario, caminho);
  } finally {
    await rm(temporario, { force: true });
  }
}

async function buscar() {
  const termo = process.argv.slice(2).join(' ').trim();
  if (!termo || termo.length > 100) {
    throw new Error('Informe um termo de busca de 1 a 100 caracteres.');
  }

  const parametros = new URLSearchParams({
    q: termo,
    image_type: 'photo',
    orientation: 'horizontal',
    min_width: '800',
    min_height: '600',
    safesearch: 'true',
    per_page: '12',
  });
  const hash = createHash('sha256').update(parametros.toString()).digest('hex');
  const caminho = join(cacheDir, `${hash}.json`);
  const cache = await lerCache(caminho);
  if (cache) return cache;

  const chave = process.env.API_KEY_PIXABAY?.trim()
    || (process.stdin.isTTY ? '' : (await text(process.stdin)).trim());
  if (!chave) throw new Error('Configure API_KEY_PIXABAY no .env ou informe a chave pela entrada padrão.');

  const url = new URL('https://pixabay.com/api/');
  parametros.set('key', chave);
  url.search = parametros.toString();

  let resposta;
  try {
    resposta = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) });
  } catch {
    throw new Error('Não foi possível conectar à API do Pixabay.');
  }
  if (!resposta.ok) throw new Error(`A API do Pixabay retornou HTTP ${resposta.status}.`);

  const dados = await resposta.json().catch(() => null);
  if (!Array.isArray(dados?.hits)) throw new Error('A API do Pixabay retornou uma resposta inválida.');
  await gravarCache(caminho, dados);
  return dados;
}

try {
  const { hits } = await buscar();
  const candidatas = hits.map(({ id, pageURL, user, largeImageURL }) => ({
    id,
    paginaOriginal: pageURL,
    autor: user,
    urlTemporaria: largeImageURL,
  }));
  console.log(JSON.stringify(candidatas, null, 2));
} catch (erro) {
  console.error(erro.message);
  process.exitCode = 1;
}
