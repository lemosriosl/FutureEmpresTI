# Spec 003 · Login, catálogo e solicitação

**Status** — Implementação e checks locais registrados no
[ENTREGA.md](../ENTREGA.md#verificações-locais). O login local foi validado
no Supabase com a conta do professor e o inventário oficial. As 12 fotos
carregaram no catálogo. O parecer sobre o intervalo de commits segue
pendente.

## Escopo

- `/login` autentica contas convidadas por e-mail e senha no Supabase Auth.
- `/catalogo` e `/catalogo/:patrimonio` exibem foto, categoria e situação dos
  equipamentos do tenant autenticado. Itens em manutenção aparecem com o
  estado correspondente e ficam fora do filtro de disponíveis.
- A confirmação de solicitação cria um empréstimo imediatamente. O serviço
  valida disponibilidade, limite de três em aberto e existência de atraso.
- `/meus-emprestimos` lista somente os empréstimos em aberto da conta logada,
  com a data prevista de devolução.

Devolução, telas de Operações, histórico na interface, reserva, renovação,
e-mail e importação ficam fora desta prática.

## Prazo e apresentação

Contar **14 dias úteis** após a retirada, de segunda a sexta, excluindo os
feriados nacionais. Preservar a hora da retirada na zona `America/Sao_Paulo`
e exibir o resultado em `pt-BR`. O cálculo usa o calendário federal de feriados
nacionais, incluindo a Paixão de Cristo, e exclui pontos facultativos da lista
de feriados. `dueAt` guarda o instante. O empréstimo fica em atraso após o
instante de vencimento.

[Calendário federal de feriados de 2026](https://legis.sigepe.gov.br/sigepe-bgp-ws-legis/legis-service/download/?id=0026440285-ALPDF%2F2025)

## Scaffold proposto

- `app/(login)/` e `app/(app)/` para as páginas Nocturne e
  `app/api/trpc/[trpc]/route.ts` para os procedimentos.
- `src/lib/supabase/` e a camada de renovação de sessão do Next. O login
  executa no servidor e escreve cookie `HttpOnly`. Os componentes usam os
  procedimentos de mesma origem. A identidade é verificada no servidor, e
  associação e papel vêm de `Membership`.
- `src/server/db.ts`, `src/server/api/` e `src/server/services/` para Prisma,
  roteadores e regras. Cada consulta de domínio recebe o tenant pelo
  contexto. A prática usa o vínculo único da identidade verificada. Contas
  sem vínculo ou com mais de um ficam sem contexto de domínio. A leitura
  inicial de vínculo é limitada ao UUID verificado. As operações de domínio
  usam transação com papel `authenticated` e `app.tenant_id` local à transação,
  além do filtro de tenant no Prisma, conforme a policy existente. O papel e
  seus grants precisam ser verificados no ambiente de validação.
- `src/components/`, configuração Next/Tailwind, `package.json` e lockfile.
  O operador aprovou instalar localmente o conjunto abaixo.

| Uso | Dependências propostas |
|---|---|
| Aplicação | `next`, `react`, `react-dom`, `@trpc/server`, `@trpc/client`, `@trpc/react-query`, `@tanstack/react-query`, `zod`, `superjson`, `react-hook-form`, `@hookform/resolvers`, `@supabase/ssr`, `@supabase/supabase-js` |
| Build e lint | `tailwindcss`, `@tailwindcss/postcss`, `postcss`, `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `eslint-config-next` |
| Testes | `vitest`, `@testcontainers/postgresql`, `@playwright/test` |

O Prisma e o TypeScript já constam no projeto. As versões do novo conjunto
devem ser compatíveis entre si e ficar registradas no lockfile.

## Critérios de aceite

| ID | Evidência esperada |
|---|---|
| CA-003-01 | Uma conta convidada entra com credenciais válidas. Acesso anônimo às rotas e aos procedimentos de domínio é negado. |
| CA-003-02 | Catálogo e detalhe exibem os 12 itens aprovados, categoria, foto, crédito e situação. Filtro de disponíveis exclui itens em manutenção e emprestados. |
| CA-003-03 | A confirmação cria um empréstimo em aberto com o vencimento de 14 dias úteis conforme o calendário aprovado. A listagem mostra apenas os próprios empréstimos em aberto. |
| CA-003-04 | O servidor rejeita item indisponível, quarto empréstimo e solicitação de conta com atraso. |
| CA-003-05 | Em PostgreSQL real, dois pedidos do mesmo item admitem um sucesso. Dois pedidos de itens diferentes para um usuário com dois empréstimos também admitem um sucesso. |
| CA-003-06 | Cada procedimento de domínio tem teste de isolamento entre tenants. O cliente não fornece `tenant_id`. |

## Tarefas e validação

1. Instalar o scaffold aprovado. Identificar o alvo local de validação e a
   revisão implantada quando houver acesso de leitura.
2. Implementar sessão e contexto antes das rotas autenticadas. Confirmar
   membership e filtros com testes de identidade e tenant.
3. Implementar catálogo, detalhe e empréstimos no fluxo tRPC. Na solicitação,
   validar o limite e criar o empréstimo na mesma transação. Testar em
   PostgreSQL o conflito de equipamento e o de limite por colaborador.
4. Implementar as telas Nocturne, rodar o fluxo Playwright e os checks do
   projeto na ordem definida. Solicitar parecer do verificador.

## Validação do servidor local

O servidor de desenvolvimento deve responder em `/login` com a configuração
local do Supabase. Usar a chave publicável do projeto no campo
`NEXT_PUBLIC_SUPABASE_ANON_KEY` esperado pelo app. Validar a rota sem gravar
empréstimos e manter as credenciais administrativas fora do app.

A listagem aceita o parâmetro `direction: 'forward'` enviado por
`useInfiniteQuery`, inclusive na primeira página e ao usar o filtro
“Só disponíveis”. O contrato continua rejeitando campos desconhecidos e a
paginação usa o cursor para avançar.

Em telas estreitas, a ação de empréstimo fica antes da foto. O detalhe mostra
quando está consultando os empréstimos da conta e permite a confirmação após
as checagens de disponibilidade, limite e atraso.

[PRD, itens 1 a 3](../docs/PRD.md) · [ADR-001](../docs/adr/001-stack.md) · [Supabase Auth SSR](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
