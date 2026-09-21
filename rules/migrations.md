---
description: Procedimento para qualquer mudança de schema
globs: ["prisma/schema.prisma", "prisma/migrations/**"]
alwaysApply: false
---

# Mudança de schema
> leitor: agente · projeto EmpresTI (FutureEmpresTI)

## Quando

Qualquer tarefa que precise criar, alterar ou remover tabela, coluna,
índice, constraint, enum, trigger ou política de acesso — inclusive quando
a mudança parecer trivial.

Inclui alterações em [prisma/schema.prisma](../prisma/schema.prisma) e SQL
bruto em [prisma/migrations/](../prisma/migrations/).

**Prisma Migrate é o único dono do schema.** Não use Supabase CLI, Studio
ou SQL avulso fora de migration versionada.

## Procedimento

1. **Antes de gerar qualquer coisa:** escreva na resposta o DDL pretendido
   (modelo Prisma + SQL de RLS/policy/trigger, se houver) e **PARE**.
   Quem aprova ou corrige é o time.
2. **Gere a migration pela CLI do Prisma:**
   ```bash
   npx prisma migrate dev --name <nome_descritivo>
   ```
   Uma migration por tarefa. Nome em snake_case, descritivo
   (ex.: `add_equipments_table`, `add_tenant_id_to_loans`).
3. **Toda tabela de domínio nova** deve ter:
   - coluna `tenant_id` com FK para `tenants` (ou equivalente no schema);
   - Row Level Security habilitada;
   - pelo menos uma policy explícita na **mesma migration** (SQL bruto
     no arquivo gerado em `prisma/migrations/<timestamp>_<nome>/migration.sql`).
   Tabela sem policy não entra no repositório.
4. **RLS é defesa em profundidade**, não autorização primária. Policies
   nascem **deny by default**; autorização de negócio continua no tRPC
   (`tenantProcedure` + service).
5. **Se a tabela já tem dado**, diga o que acontece com as linhas
   existentes. Coluna obrigatória nova precisa de `@default`, de valor
   default no SQL, ou de passo explícito de backfill na migration.
6. **Atualize o seed** ([prisma/seed.ts](../prisma/seed.ts)) se a mudança
   exigir dado inicial (ex.: tenant `suporte_ti`, memberships, equipamentos
   de exemplo). O seed deve permanecer idempotente.
7. **Aplique localmente e valide:**
   ```bash
   npx prisma migrate reset --force
   npm test
   ```
   Confirme que o banco sobe do zero, seed roda sem erro e testes passam.

## Verificação

`npx prisma migrate reset --force` numa máquina limpa aplica todas as
migrations do zero, executa o seed idempotente e termina sem passo manual.

Pronto só se:
- `migrate reset` passou;
- `npm test` passou (incluindo isolamento entre tenants, se a tabela for
  de domínio);
- `git status --short` não inclui `.env`.

## Não faça

- Não altere schema pelo Supabase Studio, pelo painel da Vercel ou por SQL
  avulso. O que não está em `prisma/migrations/` não existe.
- Não use `supabase migration new` nem `supabase db reset` — este projeto
  não versiona schema pelo Supabase CLI ([ADR-001](../docs/adr/001-stack.md)).
- Não edite migration que já foi para o repositório remoto. Escreva a
  próxima.
- Não toque no projeto Supabase remoto. Tudo acontece no banco local.
- Não crie tabela de domínio sem `tenant_id`.
- Não confie só em RLS: todo service e procedimento tRPC deve filtrar
  por tenant mesmo com policy ativa.

## Referências

- Stack e ownership de schema: [docs/adr/001-stack.md](../docs/adr/001-stack.md)
- Checks gerais de fim de tarefa: [rules/checks.md](checks.md)
- Multi-tenancy e seed: [AGENTS.md](../AGENTS.md) §7 e §12
