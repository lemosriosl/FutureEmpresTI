# Spec: popular dados iniciais no Supabase

## Objetivo

Deixar o ambiente Supabase utilizável para demonstração da v1, com dados
coerentes entre tenant, equipamentos, memberships, empréstimos e auditoria,
sem criar identidades falsas no Supabase Auth.

## Escopo

- Garantir o tenant idempotente `suporte_ti`.
- Usar somente usuários já existentes em `auth.users` para criar memberships.
- Criar equipamentos demonstrativos idempotentes.
- Criar empréstimos históricos e, se houver usuários, um empréstimo em aberto
  coerente com as constraints existentes.
- Criar logs de auditoria correspondentes à carga inicial.
- Atualizar `prisma/seed.ts` para que a carga possa ser repetida sem duplicar
  registros.
- Aplicar a carga no projeto Supabase autorizado pelo usuário e verificar as
  contagens e relacionamentos depois.

## Restrições

- Não criar usuários Auth nem inventar UUIDs de usuários.
- Não alterar schema, migrations, policies ou configurações remotas.
- Não inserir empréstimo aberto sem membership e equipamento do mesmo tenant.
- Não expor valores de `.env`, chaves ou connection strings.
- A carga deve ser limitada ao tenant `suporte_ti`.

## Critérios de aceite

- `suporte_ti` existe exatamente uma vez.
- Há memberships somente para usuários reais encontrados no Auth.
- Há equipamentos demonstrativos únicos por patrimônio.
- Empréstimos inseridos respeitam FKs e o índice de um empréstimo aberto por
  equipamento.
- Logs de auditoria correspondem às operações de carga e permanecem append-only.
- A segunda execução não duplica tenant, memberships, equipamentos ou loans.
- Consultas pós-carga confirmam as contagens e as relações entre as tabelas.

## Validação

- Executar o seed com a conexão configurada, sem imprimir segredos.
- Repetir o seed para verificar idempotência.
- Consultar contagens e amostras no Supabase.
- Rodar `git diff --check` e os checks disponíveis do projeto; registrar os
  checks ausentes se o scaffold ainda não os fornecer.
