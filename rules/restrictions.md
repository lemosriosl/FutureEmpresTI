---
description: O que o agente não pode fazer neste projeto
globs: []
alwaysApply: true
---

# O que não fazer
> leitor: agente · projeto EmpresTI (FutureEmpresTI)

## Autoridade

- Não escreva ADR. Se encontrar uma decisão que precisa de um, descreva
  a decisão e as alternativas, e PARE. Quem decide é o time.
- Não contrarie o que está em [docs/adr/001-stack.md](../docs/adr/001-stack.md).
  Se precisar contrariar, pare e avise.
- Não responda por conta própria o que o PRD deixou ambíguo. Consulte
  [docs/perguntas-prd.md](../docs/perguntas-prd.md) e, se ainda faltar
  resposta, liste as perguntas e espere.
- Não escolha biblioteca que não esteja no ADR-001. Proponha e espere.
- Não implemente funcionalidade listada em "O que NÃO entra nesta versão"
  em [docs/PRD.md](../docs/PRD.md) sem confirmação explícita.

## Escopo

- Não altere arquivo fora do escopo da tarefa atual.
- Não gere scaffold automático de framework sem mostrar antes o que ele
  vai criar.
- Não escreva código de funcionalidade de produto sem respaldo em
  [docs/PRD.md](../docs/PRD.md) ou [layout.md](../layout.md).
- Não desvie do design system Nocturne descrito em [layout.md](../layout.md):
  somente modo escuro, botões contornados, sem modo claro.

## Arquitetura e dados

- Não introduza Server Actions para mutação; tRPC é o caminho principal.
- Não crie acesso paralelo ao banco (cliente Supabase no browser, fetch
  direto ao Postgres, etc.) fora de Prisma + tRPC.
- Não aceite `tenant_id` vindo do input do cliente; resolva no
  `createContext` e aplique via `tenantProcedure`.
- Não ignore `tenant_id` em query, mutation ou teste de domínio.
- Não use Prisma mockado para comportamento que depende de constraint,
  transação, cascade ou RLS — use Postgres real (Testcontainers).
- Não use `NEXT_PUBLIC_` para segredos nem exponha `service_role` no
  cliente.
- Não versione `.env`, credenciais, DSN ou chaves de produção.
- Não use Supabase CLI como dono de schema; Prisma Migrate é o único
  dono das migrations.

## Ritmo

- Não comece edições grandes sem um plano breve visível na resposta.
- Priorize uma tarefa por vez; rode os checks antes de declarar pronto.
- Não relate sucesso parcial. Se um check falhou, a tarefa não terminou.
- Não tente consertar a mesma falha duas vezes seguidas sem mostrar
  a saída do erro.

## Produção e ambiente remoto

- Não faça push na branch de produção. Trabalhe em branch e abra PR.
- Não rode deploy nem altere configuração da Vercel.
- Não toque no projeto Supabase remoto: nada de SQL, alteração de schema
  ou dado por lá. Migrations e seed rodam no ambiente local.
- Não rode testes contra o banco remoto.

## Precedência

- Se o código e o PRD discordarem sobre comportamento de negócio, o PRD
  está certo até que alguém mude o PRD.
- Se o código e [layout.md](../layout.md) discordarem sobre interface,
  o layout está certo até que alguém mude o layout.
- Se uma regra de procedimento contrariar o ADR ou o PRD, PARE e avise.
  Não escolha um dos dois por conta própria.
- Em conflito entre este arquivo e [AGENTS.md](../AGENTS.md), prevalece
  o que for mais restritivo em segurança e escopo.
