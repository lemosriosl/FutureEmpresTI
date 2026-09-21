---
description: O que precisa passar antes de declarar uma tarefa pronta
globs: []
alwaysApply: true
---

# Verificação de fim de tarefa
> leitor: agente · projeto EmpresTI (FutureEmpresTI)

## Quando

Sempre que você for dizer "pronto", "implementado" ou "funcionando".

Se o projeto ainda não tiver `package.json` ou scripts configurados,
declare o que falta configurar em vez de inventar sucesso.

## Procedimento

Execute na ordem abaixo o que existir no repositório:

1. **Testes** — `npm test` (Vitest). Cole a última linha da saída na resposta.
   - Se a tarefa tocou em procedimento tRPC de domínio, confirme que há
     (ou manteve) teste de isolamento: tenant A não enxerga dado de tenant B.
2. **Migration** — se a tarefa alterou `prisma/schema.prisma` ou migrations:
   rode `npx prisma migrate reset --force` local e confirme que o banco sobe
   do zero com seed idempotente (`suporte_ti`).
3. **Lint** — `npm run lint`. Deve terminar sem erro.
4. **Build** — `npm run build`. Rode antes de qualquer push; build que quebra
   na Vercel é o feedback mais lento e mais caro deste projeto.
5. **Git** — `git status --short`. Só podem aparecer arquivos do escopo
   da tarefa (nunca `.env` ou segredos).
6. **Critério de aceitação** — diga qual item do PRD ou qual regra de negócio
   a tarefa atende. Use a numeração de
   [docs/PRD.md](../docs/PRD.md) ("O que precisa existir na primeira versão"
   ou "Regras que Operações já decidiu").

## Verificação

Pronto = todos os comandos aplicáveis terminaram sem falha E o git status
não trouxe surpresa. As duas coisas, não uma.

Tarefa só de documentação ou config sem scripts: valide coerência com PRD,
ADR e layout, e informe explicitamente quais checks foram pulados e por quê.

## Checklist de segurança (quando a tarefa tocar em API, auth ou banco)

- [ ] `tenant_id` vem do contexto, nunca do input do cliente
- [ ] Procedimentos de domínio passam por `tenantProcedure` (ou middleware
      equivalente definido no ADR)
- [ ] Nenhum segredo em arquivo versionado nem em variável `NEXT_PUBLIC_`
- [ ] Validação de entrada via Zod no `.input()` do procedimento

## Não faça

- Não relate sucesso parcial. Teste vermelho é tarefa não terminada,
  mesmo que o código "esteja certo".
- Não pule build ou lint "porque foi mudança pequena".
- Não declare pronto sem mencionar qual critério do PRD foi atendido.
