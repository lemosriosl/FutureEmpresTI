# Entrega da prática SDD

**Status** — Monólito implementado localmente, inventário oficial carregado
no Supabase, 12 fotos publicadas no Storage e login validado com a conta do
professor. A publicação da aplicação segue pendente.

## Referências

- [Repositório no GitHub](https://github.com/lemosriosl/FutureEmpresTI)
- [Endereço da Vercel informado pelo repositório](https://futureempresti.vercel.app/).
  A revisão atualmente publicada e o fluxo de login não puderam ser confirmados.
- [Plano da prática](spec/pratica-sdd-plano-de-acao.md)
- [Spec 002 · Dados iniciais](spec/002-dados-iniciais.md)
- [Spec 003 · Login, catálogo e solicitação](spec/003-catalogo-solicitacao.md)

## Decisões

| Tema | Decisão e evidência |
|---|---|
| Fotos | O enunciado original exigia Pexels. O operador informou que o professor aprovou Pixabay. A skill registra cache, créditos e revisão visual. |
| Prazo | O plano inicial propunha 14 dias corridos. O operador confirmou 14 dias úteis, de segunda a sexta, com exclusão dos feriados nacionais e vencimento no horário da retirada em São Paulo. |
| ADR-001 | O monólito local usa Next, tRPC, Prisma e Supabase Auth. Para as imagens, a spec 002 propõe aproveitar o UUID existente e usar ferramentas locais, evitando uma migration e uma dependência de processamento de imagens. |
| Regra posta à prova | O verificador identificou a falha e devolveu o parecer. O agente principal corrigiu o exemplo. Uma segunda sessão em contexto limpo verificou a correção. |

## Pareceres do verificador

Os commits estão na branch `feat/ensaio-verificador-sdd`. Os dois
pareceres e seus intervalos constam no [plano](spec/pratica-sdd-plano-de-acao.md#evidências-do-ensaio-local).

| Revisão | Check local | Parecer |
|---|---|---|
| `68cdb24deb5bf201617290f6d95fca6ead3d670a` | `CA-ENSAIO-01` falhou | `NÃO PRONTA` |
| `d2155b239f784d31ac242272b130f6b056a2b0a8` | `CA-ENSAIO-01` passou | `PRONTA` |

## Execução local

Rode `pnpm db:generate` e `pnpm dev` com o `.env` do ambiente autorizado.
O login usa o Supabase Auth do projeto. O Prisma usa o PostgreSQL configurado,
e o catálogo lê as fotos do bucket descrito na spec 002. A suíte
`pnpm test:db` usa PostgreSQL descartável no Docker. Ela aplica a migration
versionada no contêiner e cria vínculos e empréstimos fictícios.

## Verificações locais

| Check | Resultado |
|---|---|
| `pnpm test` | 7 testes aprovados, incluindo prazo em feriados e regras de acesso do procedimento. |
| `pnpm test:db` | 7 testes aprovados em PostgreSQL real, incluindo manutenção, limite, atraso, concorrência, isolamento e duas execuções da carga com histórico preservado. |
| `pnpm test:e2e` | 3 testes aprovados em Chromium, incluindo redirecionamento anônimo, envio do formulário e bloqueio de origem externa. |
| `pnpm lint` | Passou. |
| `pnpm build` | Passou com valores fictícios de configuração. |
| Login local com Supabase do projeto | Passou. A conta do professor acessou os 12 itens do catálogo e a listagem retornou zero empréstimos. |
| Fotos no catálogo | Os 12 JPEGs de 800×600 responderam sem autenticação e carregaram no navegador. [Manifesto das fotos](spec/entrega3-fotos.md) |
| Ação de empréstimo em tela estreita | O botão aparece antes da foto e abre a confirmação. A gravação foi conferida em PostgreSQL descartável. |

## Conferência do Supabase

Em 09/11/2026, a consulta somente leitura encontrou `suporte_ti` com 5
equipamentos, zero patrimônios no padrão `TI-0001` e zero vínculos. O projeto
também não tinha bucket de Storage. Os grants do papel `authenticated` foram
conferidos e a leitura do catálogo sob esse papel retornou os 5 registros.
[Conferência na spec 002](spec/002-dados-iniciais.md#conferência-do-supabase-existente)

Com o inventário da Entrega 3 aprovado, a carga retirou os 5 itens antigos
do catálogo e confirmou 12 itens oficiais. `TI-0004` e `TI-0007` ficaram em
manutenção, e `TI-0010` ficou disponível. A segunda execução manteve os
mesmos registros e estados. [Resultado na spec 002](spec/002-dados-iniciais.md#resultado-da-carga)

## Evidências pendentes

- O login usa o rate limit do Auth. O contador PostgreSQL por IP e usuário
  previsto no ADR ainda exige DDL aprovado.
- Aprovação das specs 002 e 003 pelo verificador e validação na Vercel.

O código da prática está na branch `feat/plano-pratica-sdd`. O deploy e a
tag de entrega dependem de uma etapa de publicação. Devolução, telas de Operações,
reserva, renovação, e-mail e importação estão fora do escopo da prática.
