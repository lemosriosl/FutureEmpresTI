# Spec: modelo de banco da v1

## Objetivo

Definir o modelo relacional da v1 de empréstimo de equipamentos, conforme o
PRD e o ADR-001, preservando isolamento por tenant e o histórico de devoluções.

## Escopo

- Entidades: `Tenant`, `Membership`, `Equipment`, `Loan` e `AuditLog`.
- `Membership` relaciona o UUID de Supabase Auth ao tenant e ao papel
  (`COLLABORATOR` ou `ADMIN`). A identidade permanece sob responsabilidade do
  Supabase Auth.
- `Equipment` armazena patrimônio, nome, categoria, número de série, local,
  observações e estado operacional (`AVAILABLE`, `MAINTENANCE` ou
  `OUT_OF_SERVICE`). A condição “emprestado” é derivada de um empréstimo aberto.
- `Loan` é criado imediatamente na solicitação; não existe estado intermediário
  de reserva ou aprovação. Registros devolvidos são mantidos para o histórico.
- `AuditLog` é append-only, com tenant, ator, ação e recurso.

## Regras e integridade

- Cada tabela de domínio carrega `tenant_id` com FK para `tenants`.
- Patrimônio é único dentro do tenant.
- Um índice único parcial impede mais de um empréstimo aberto por equipamento.
- `borrowed_at`, `due_at` e `returned_at` guardam o ciclo do empréstimo; o prazo
  padrão de 14 dias é calculado no service e atraso é derivado comparando
  `due_at` com o instante atual.
- Limite de três empréstimos abertos por pessoa e bloqueio por atraso são
  validados em transação no service.
- Toda tabela recebe RLS e policy explícita na mesma migration. O tenant da
  transação é definido por `SET LOCAL app.tenant_id`; a conexão de runtime não
  pode usar um papel com `BYPASSRLS`.
- `AuditLog` rejeita `UPDATE` e `DELETE` por trigger.

## Fora de escopo

Fila, reserva futura, notificações, importação de planilha, usuários locais
duplicados de Supabase Auth e rate-limit counters, que pertencem à infraestrutura
e não ao modelo de domínio desta tarefa.

## Critérios de aceite

- Schema Prisma e migration Prisma representam as entidades, chaves, índices,
  policies RLS e trigger descritos acima.
- Banco local sobe do zero; seed idempotente cria o tenant `suporte_ti`.
- Testes com PostgreSQL real verificam integridade, empréstimo aberto único,
  histórico e isolamento entre tenants.
- Nenhuma migration é aplicada a banco remoto nesta tarefa.

## Validação e bloqueio atual

Após existir scaffold Prisma e banco PostgreSQL local identificado: gerar a
migration com Prisma Migrate, executar `prisma migrate reset --force`, verificar
seed idempotente e então rodar os checks definidos em `rules/checks.md`.

No estado atual do repositório não há `package.json` nem diretório `prisma/`.
O `.env` existe, mas seu destino não deve ser presumido local. Portanto, antes
da migration, é necessário configurar/aprovar o scaffold Prisma e disponibilizar
uma conexão local; não usar a conexão existente sem confirmar o destino.