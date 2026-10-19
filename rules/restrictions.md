---
description: O que o agente não pode fazer neste projeto
globs: []
alwaysApply: true
---

# O que não fazer
> leitor: agente · projeto EmpresTI (FutureEmpresTI)

## Autoridade

- Registre decisões em ADR quando o time solicitar ou aprovar a decisão.
  Se a decisão não estiver aprovada, apresente alternativas e pergunte; não
  marque uma proposta como aceita.
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

- Plano, spec, progresso e tratamento de bloqueios seguem
  [rules/spec-flow.md](spec-flow.md). Checks finais seguem
  [rules/checks.md](checks.md).
- Nunca apresente trabalho parcial como concluído.
- Não tente consertar a mesma falha duas vezes seguidas sem mostrar
  a saída do erro.

## Produção e ambiente remoto

- Não faça push na branch de produção. Trabalhe em branch e abra PR.
- Não rode deploy sem solicitação explícita. Configuração remota da Vercel
  pode ser alterada no escopo da tarefa conforme [rules/operacao.md](operacao.md)
  e [rules/secrets.md](secrets.md).
- Acesso aos serviços remotos usados pelo projeto (incluindo Supabase, Vercel
  e ambientes/variáveis remotas) é permitido quando estiver no escopo da tarefa
  e houver credenciais disponíveis. Limite a ação aos recursos necessários.
- Alterações remotas de schema continuam sujeitas a
  [rules/migrations.md](migrations.md): use migrations versionadas do Prisma;
  não altere schema pelo Studio, Supabase CLI ou SQL avulso.
- Não faça alterações destrutivas em dados de produção nem rode testes contra
  banco remoto sem solicitação explícita para essa ação.
- Não exponha valores de segredos em respostas, logs, saídas de comandos,
  screenshots ou arquivos versionados. Consulte [rules/secrets.md](secrets.md).

## Precedência

- Se o código e o PRD discordarem sobre comportamento de negócio, o PRD
  está certo até que alguém mude o PRD.
- Se o código e [layout.md](../layout.md) discordarem sobre interface,
  o layout está certo até que alguém mude o layout.
- Se uma regra de procedimento contrariar o ADR ou o PRD, PARE e avise.
  Não escolha um dos dois por conta própria.
- Em conflito entre este arquivo e [AGENTS.md](../AGENTS.md), prevalece
  o que for mais restritivo em segurança e escopo.
