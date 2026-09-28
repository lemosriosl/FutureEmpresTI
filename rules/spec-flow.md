---
description: Fluxo obrigatório para transformar uma especificação em mudança verificável
globs: []
alwaysApply: true
---

# Spec-flow
> leitor: agente · projeto EmpresTI (FutureEmpresTI)

## Objetivo

Toda tarefa deve sair de uma especificação clara e chegar a uma mudança pequena,
implementada e validada. O agente deve seguir este fluxo antes de declarar a
tarefa concluída.

## 1. Entender a solicitação

1. Identifique o comportamento pedido, o usuário afetado e o resultado esperado.
2. Localize o ponto mais próximo que controla o comportamento: tela, procedimento,
   service, schema ou migration.
3. Consulte, conforme o caso, o [PRD](../docs/PRD.md), o
   [ADR-001](../docs/adr/001-stack.md), o [layout](../layout.md) e as regras
   relacionadas em `rules/`.
4. Escreva uma hipótese local e um check barato que possa confirmá-la ou
   refutá-la antes da primeira edição.

## 2. Resolver incertezas

- Se o PRD ou `docs/perguntas-prd.md` deixar o comportamento ambíguo, pare,
  formule a pergunta e espere a decisão do time.
- Se a solução contrariar o ADR, descreva a decisão e as alternativas e pare.
- Se a tarefa estiver fora da v1, peça confirmação explícita antes de
  implementar.
- Não invente regras de negócio, permissões, campos, rotas ou mensagens.

## 3. Planejar a mudança

Antes de editar mais de um arquivo, informe um plano breve com:

- arquivos ou camadas que serão alterados;
- regra de negócio ou critério do PRD atendido;
- teste mais direto que valida a mudança;
- riscos, especialmente em auth, tenant, banco e migrations.

Escolha a menor alteração que respeite a arquitetura:

```text
UI -> tRPC router -> service -> Prisma
```

Regras de negócio ficam no service. O router cuida de entrada, contexto e
permissão. A interface não deve ser a única barreira para uma regra.

## 4. Implementar

- Preserve APIs públicas e padrões locais quando não houver necessidade de
  alterá-los.
- Valide toda entrada de procedimento com Zod.
- Resolva `tenant_id` no contexto e aplique `tenantProcedure`; nunca aceite o
  tenant vindo do cliente.
- Use `RouterInputs` e `RouterOutputs` inferidos do `AppRouter`.
- Para mudança de schema, pare antes de gerar a migration e siga
  [rules/migrations.md](migrations.md).
- Para variável nova, siga [rules/secrets.md](secrets.md).
- Para interface, siga o Nocturne em [layout.md](../layout.md).
- Não faça refatorações não relacionadas à tarefa.

## 5. Validar imediatamente

Depois da primeira edição, execute o check mais barato e específico disponível:

1. teste do service ou procedimento tocado;
2. teste de componente ou E2E do fluxo afetado;
3. lint ou typecheck do trecho alterado;
4. `git diff --check`, se não houver comando executável disponível.

Se falhar:

- corrija o mesmo slice e repita o check;
- se a hipótese estiver errada, dê apenas um passo até o código que realmente
  controla o comportamento;
- não amplie a busca antes de resolver essa decisão local.

## 6. Verificação final

Siga [rules/checks.md](checks.md) e execute todos os comandos aplicáveis:

```text
npm test
npx prisma migrate reset --force   # se schema ou migration mudou
npm run lint
npm run build
git status --short
```

Se scripts ou scaffold ainda não existirem, informe explicitamente os checks
que foram pulados e o motivo. Não declare sucesso como se tivessem passado.

A resposta final deve informar:

- o que mudou;
- quais checks foram executados e seus resultados;
- qual item do PRD ou regra de negócio foi atendido;
- riscos ou pendências conhecidas.

## 7. Handoff

Handoff não é automático. Antes de criar ou atualizar qualquer arquivo em
[handoff/](../handoff/), pergunte ao usuário se ele deseja um handoff e espere
confirmação explícita. Depois da confirmação, use o modelo
[handoff/handoff.md](../handoff/handoff.md).

## Não faça

- Não declare uma tarefa pronta sem validação aplicável.
- Não edite antes de formar uma hipótese local e um check discriminante.
- Não continue buscando indefinidamente depois que o caminho local estiver
  identificado.
- Não use mocks do Prisma para validar constraint, transação, cascade ou RLS.
- Não altere ambiente remoto, Vercel ou Supabase.
- Não crie commit sem solicitação explícita.
