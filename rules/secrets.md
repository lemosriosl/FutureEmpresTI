---
description: Onde cada variável de ambiente vive e qual chave usar
globs: ["**/.env*", "src/lib/**", "src/server/**", "src/env.ts"]
alwaysApply: false
---

# Variáveis de ambiente e chaves
> leitor: agente · projeto EmpresTI (FutureEmpresTI)

## Quando

Ao criar ou usar qualquer variável de ambiente, ao instanciar cliente
Supabase ou Prisma, ou ao escrever código que lê configuração
(ex.: `src/env.ts`, `src/lib/supabase/**`, `src/server/db.ts`).

## Mapa de variáveis (v1)

| Variável | Onde roda | Sensível | Uso |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente + servidor | Não (pública) | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente + servidor | Não (pública) | Auth no browser; protegida por RLS |
| `DATABASE_URL` | Servidor | **Sim** | Prisma runtime via Supavisor (porta 6543, `pgbouncer=true`) |
| `DIRECT_URL` | Servidor (migrate/CLI) | **Sim** | Prisma Migrate e comandos diretos (porta 5432) |
| `SUPABASE_SERVICE_ROLE_KEY` | Servidor | **Sim** | Bypassa RLS; só operações server-side excepcionais |
| `SENTRY_DSN` | Servidor | **Sim** | Rastreamento de erros (quando configurado) |

Referência versionada: [.env.example](../.env.example).
Validação no boot: Zod em `src/env.ts` (ADR-001).

## Procedimento

1. **Chave pública (anon):** só `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` podem aparecer em código que roda no
   navegador (`"use client"`, hooks, componentes). A proteção delas são
   as policies de RLS — não a obscuridade da chave.

2. **Chaves de serviço e banco:** `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`,
   `DIRECT_URL` e `SENTRY_DSN` ignoram ou expõem o banco inteiro.
   Só em código de servidor (`src/server/**`, Route Handlers, `createContext`).
   Nunca em componente de cliente, nunca com prefixo `NEXT_PUBLIC_`.

3. **Prisma:** instanciar somente em `src/server/db.ts` (singleton).
   `DATABASE_URL` para runtime; `DIRECT_URL` para `prisma migrate` e
   `prisma db seed`. Não importar `@prisma/client` em arquivos com
   `"use client"`.

4. **Supabase no browser:** usar `@supabase/ssr` com anon key em
   `src/lib/supabase/client.ts`. Supabase com `service_role` fica em
   `src/lib/supabase/server.ts` ou equivalente server-only.

5. **Variável nova existe em TRÊS lugares ou em nenhum:**
   - `.env` (sua máquina, **nunca versionado**)
   - `.env.example` (versionado, placeholder sem valor real)
   - painel da Vercel (Preview e Production)

   Ao criar uma variável, diga na resposta em quais dos três lugares
   você já colocou e o que falta o time fazer à mão na Vercel.

6. **Validação:** toda variável obrigatória entra no schema Zod de
   `src/env.ts`. Falhar no boot é preferível a `undefined` silencioso
   em produção.

## Verificação

- Busca por `service_role`, `SUPABASE_SERVICE_ROLE`, `DATABASE_URL` ou
  `DIRECT_URL` em arquivos `"use client"` ou em `src/components/**`
  não retorna uso indevido.
- `.env.example` lista **todas** as chaves que o projeto usa, sem valor
  real (só placeholders).
- `git status --short` não inclui `.env`.
- `npm run build` passa com variáveis definidas localmente.

## Não faça

- Não escreva valor de chave em resposta, commit, log ou comentário.
- Não crie variável só no `.env`. Sem entrada em `.env.example` quebra
  o deploy e o erro só aparece no build da Vercel.
- Não versione `.env`, `.env.local` ou qualquer arquivo com credencial.
- Não contorne policy de RLS trocando de anon para `service_role`. Se a
  policy atrapalha, a policy está errada — pare e avise.
- Não use `NEXT_PUBLIC_` para segredo (ADR-001: vai para o bundle).
- Não hardcodar URL ou chave Supabase no código — sempre via env.

## Referências

- ADR (segredos e conexões): [docs/adr/001-stack.md](../docs/adr/001-stack.md)
- Setup local: [AGENTS.md](../AGENTS.md) §12
- Checks de fim de tarefa: [rules/checks.md](checks.md)
