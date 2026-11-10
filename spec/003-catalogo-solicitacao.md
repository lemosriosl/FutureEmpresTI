# Spec 003 · Login, catálogo e solicitação

**Status** — O verificador aprovou CA-003-03 a CA-003-06 em `2eff5e0`.
Solicitou evidência de login real em CA-003-01 e de apresentação em CA-003-02.
O operador aprovou o DDL do controle de tentativas do ADR-001 em 10/11/2026.

### Revalidação do build

Corrigir os erros de TypeScript dos testes de catálogo, integração e fotos
identificados durante a conferência da prática. Manter os fluxos e a
cobertura de teste existentes. Rodar testes, lint e build com configuração
local, sem usar os dados da prática para gerar empréstimos de teste.

### Decisão de fechamento da prática

O operador pediu para seguir o briefing. O limite passa a cinco empréstimos
em aberto por colaborador. Alinhar PRD, layout, mensagens e testes. O quinto
pedido disponível deve passar, o sexto deve ser recusado e dois pedidos
simultâneos com quatro empréstimos em aberto devem produzir um único sucesso.
Preservar a transação, a checagem de atraso e o isolamento entre tenants.

O catálogo apresenta as fotos preparadas e hospedadas no Storage. Os créditos
ficam no manifesto. Completar a validação Playwright com Supabase Auth e
PostgreSQL descartáveis. O cenário confere login, cookie `HttpOnly`, catálogo,
filtro, detalhe, confirmação, vencimento e transição para emprestado.
Cada suíte Playwright usa seu próprio diretório gerado pelo Next, para rodar
enquanto o servidor de desenvolvimento está aberto.

## Escopo

- `/login` autentica contas convidadas por e-mail e senha no Supabase Auth.
- `/catalogo` e `/catalogo/:patrimonio` exibem foto, categoria e situação dos
  equipamentos do tenant autenticado. Itens em manutenção aparecem com o
  estado correspondente e ficam fora do filtro de disponíveis.
- A confirmação de solicitação cria um empréstimo imediatamente. O serviço
  valida disponibilidade, limite de cinco em aberto e existência de atraso.
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
| Testes | `vitest`, `@testcontainers/postgresql`, `testcontainers` na mesma versão já travada como transitiva, `@playwright/test` |

O Prisma e o TypeScript já constam no projeto. As versões do novo conjunto
devem ser compatíveis entre si e ficar registradas no lockfile.

## Critérios de aceite

| ID | Evidência esperada |
|---|---|
| CA-003-01 | Uma conta convidada entra com credenciais válidas. Acesso anônimo às rotas e aos procedimentos de domínio é negado. |
| CA-003-02 | Catálogo e detalhe exibem os itens aprovados com categoria, foto e situação. O catálogo mostra os 12 itens, sem rodapé de créditos. O filtro de disponíveis exclui itens em manutenção e emprestados. |
| CA-003-03 | A confirmação cria um empréstimo em aberto com o vencimento de 14 dias úteis conforme o calendário aprovado. A listagem mostra apenas os próprios empréstimos em aberto. |
| CA-003-04 | O servidor aceita o quinto empréstimo disponível e rejeita o sexto, item indisponível e solicitação de conta com atraso. |
| CA-003-05 | Em PostgreSQL real, dois pedidos do mesmo item admitem um sucesso. Dois pedidos de itens diferentes para um usuário com quatro empréstimos também admitem um sucesso. |
| CA-003-06 | Cada procedimento de domínio tem teste de isolamento entre tenants. O cliente não fornece `tenant_id`. |
| CA-003-07 | O login consulta o Supabase Auth sem depender de contador ou segredo local. Uma resposta HTTP 429 do provedor informa que é preciso aguardar. |

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

### Correções do parecer de `2eff5e0`

- CA-003-01. Adicionar fluxo Playwright com Supabase Auth e PostgreSQL reais,
  descartáveis em Docker local. Criar e confirmar uma conta fictícia, vinculá-la
  ao tenant e entrar pelo formulário. Conferir redirecionamento, sessão
  `HttpOnly` e acesso ao catálogo. Manter as verificações de acesso anônimo.
- CA-003-02. No mesmo cenário, conferir os 12 cartões, categoria, patrimônio,
  foto carregada, situação e filtro de disponíveis. Usar imagens
  de teste locais no navegador e verificar os JPEGs publicados pelo teste
  separado do CA-002-04.
- Rodar o cenário isolado com `pnpm test:e2e:catalogo`, além dos checks
  existentes. O teste usa a imagem oficial do Supabase Auth em versão fixa
  e credenciais aleatórias descartáveis.

### Implementação anterior do controle de tentativas

DDL aprovado para validação local. Criar `login_rate_limits` para contadores
independentes por IP e por identificador de login normalizado. A consulta
acontece antes de autenticar e resolver o tenant. O modelo guarda escopo,
digest HMAC, início da janela e contador. Ativar RLS, revogar o acesso
das roles da API e manter o acesso do papel de runtime do Prisma.

Usar uma janela de 15 minutos, 5 tentativas por identificador e 30 por IP.
Atualizar os contadores na mesma transação e rejeitar com HTTP 429 quando
qualquer limite for atingido. Consumir a cota de IP primeiro, para que um IP
já bloqueado não altere a cota de outra conta. Na Vercel, aceitar o IP do cabeçalho
`x-vercel-forwarded-for` definido pela plataforma. Usar uma chave privada
`LOGIN_RATE_LIMIT_SECRET` para o HMAC e expirar contadores antigos. Testar
limite, concorrência, recuperação e bloqueio de acesso pelas roles da API
em PostgreSQL descartável.

### Recuperação do login publicado

A revisão publicada ficou indisponível porque o login consultava o contador
antes de chamar o Supabase Auth. O operador solicitou a remoção do limitador
do aplicativo. Remover o serviço, a leitura de IP e a configuração HMAC
do login. Manter a validação das credenciais pelo Supabase Auth, o vínculo
com o tenant e o tratamento de HTTP 429 do provedor. Preservar o histórico
de migrations publicado. Validar o login real em ambiente descartável e
confirmar que a Vercel processa uma tentativa após o deploy.

A comparação de 77 objetos confirmou a presença dos objetos da migration
inicial. O trigger de auditoria apresentou diferença de formatação na
definição e foi conferido pelo evento, função e corpo. O ensaio em PostgreSQL
descartável registrou `20261019000000_init`, executou `migrate deploy` duas
vezes e confirmou o acesso do runtime e o bloqueio da role da API.

O ensaio e o workflow de Prisma registram o caminho avaliado para a
recuperação anterior. A retirada do limitador elimina essa dependência do
login.

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
