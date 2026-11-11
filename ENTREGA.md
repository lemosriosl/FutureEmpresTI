# Entrega da prática SDD

**Status** — A carga dos 12 equipamentos e as fotos publicadas estão
documentadas na [spec 002](spec/002-dados-iniciais.md). A revisão
[`5033851`](https://github.com/lemosriosl/FutureEmpresTI/commit/5033851)
inclui o fluxo de empréstimo e o ajuste mais recente do login. A confirmação
dessa revisão na Vercel, os pareceres finais e a tag estão pendentes.

## Referências

- [Repositório no GitHub](https://github.com/lemosriosl/FutureEmpresTI)
- [Endereço da Vercel informado pelo repositório](https://futureempresti.vercel.app/).
  Em 10/11/2026, o catálogo redirecionou visitantes sem sessão para `/login`,
  que respondeu com HTTP 200. A tag `entrega-pratica` não estava no GitHub.
- [Plano da prática](spec/pratica-sdd-plano-de-acao.md)
- [Spec 002 · Dados iniciais](spec/002-dados-iniciais.md)
- [Spec 003 · Login, catálogo e solicitação](spec/003-catalogo-solicitacao.md)

## 1. Conflitos

| Pedido | Conflito | Decisão e motivo | Registro | Commit |
|---|---|---|---|---|
| Aceitar até cinco empréstimos | O PRD anterior fixava três. | O operador pediu para seguir o briefing. O PRD, as mensagens e os testes adotam cinco para manter a mesma regra na interface e no servidor. | [PRD](docs/PRD.md#regras-que-operações-já-decidiu) e [spec 003](spec/003-catalogo-solicitacao.md#decisão-de-fechamento-da-prática) | [`2812804`](https://github.com/lemosriosl/FutureEmpresTI/commit/2812804) |
| Definir quais itens estão em manutenção | A lista do HTML inclui `TI-0010`. O briefing marca apenas `TI-0004` e `TI-0007`. | A coluna aprovada da planilha coincide com o briefing. O cabo `TI-0010` entra disponível. | [Spec 002](spec/002-dados-iniciais.md#decisões-e-pendências) | [`2eff5e0`](https://github.com/lemosriosl/FutureEmpresTI/commit/2eff5e0) |
| Instalar `sharp` | O briefing sugere uma dependência que exige aprovação pelas regras do projeto. | Usar a exportação local para produzir JPEGs de 800×600 e testar o arquivo publicado, pois o filtro de busca mede a imagem de origem. | [Skill](skills/imagens-equipamentos/SKILL.md#preparar-e-entregar) e [CA-002-04](spec/002-dados-iniciais.md#revalidação-do-ca-002-04) | [`2eff5e0`](https://github.com/lemosriosl/FutureEmpresTI/commit/2eff5e0), [`2812804`](https://github.com/lemosriosl/FutureEmpresTI/commit/2812804) |
| Escrever a senha no seed | As regras de segredos vedam credenciais no código e no histórico. | O operador configura a senha no Auth por entrada segura. A carga associa a conta confirmada ao tenant usando a identidade já criada. | [Spec 002](spec/002-dados-iniciais.md#decisões-e-pendências) | [`2eff5e0`](https://github.com/lemosriosl/FutureEmpresTI/commit/2eff5e0) |
| Deixar o verificador corrigir o teste | A correção tiraria a independência da revisão. | O verificador relata a falha. O agente principal corrige e solicita novo parecer em contexto limpo para separar autoria de avaliação. | [Ensaio](spec/pratica-sdd-plano-de-acao.md#evidências-do-ensaio-local) | [`68cdb24`](https://github.com/lemosriosl/FutureEmpresTI/commit/68cdb24), [`d2155b2`](https://github.com/lemosriosl/FutureEmpresTI/commit/d2155b2) |

## 1b. Lacunas

| Spec | Lacuna | Alternativas consideradas | Decisão e motivo | Commit |
|---|---|---|---|---|
| [003](spec/003-catalogo-solicitacao.md#prazo-e-apresentação) | Calendário e horário do vencimento | Dias corridos, dias de semana ou dias úteis com feriados. | Contar segunda a sexta, exceto feriados nacionais, e manter o horário da retirada em São Paulo. Assim, a data mostrada e o início do atraso usam o mesmo vencimento. | [`2eff5e0`](https://github.com/lemosriosl/FutureEmpresTI/commit/2eff5e0) |
| [002](spec/002-dados-iniciais.md#decisões-e-pendências) | Destino dos itens de demonstração | Apagar itens, deixá-los no catálogo ou retirá-los de serviço. | Retirar os cinco itens aprovados do catálogo e preservar seus registros e o histórico. | [`2eff5e0`](https://github.com/lemosriosl/FutureEmpresTI/commit/2eff5e0) |
| [002](spec/002-dados-iniciais.md#decisões-e-pendências) | Referência da foto | Nova coluna ou chave derivada do UUID. | Usar `equipamentos/<UUID>.jpg` para manter a referência estável sem mudar o schema. | [`2eff5e0`](https://github.com/lemosriosl/FutureEmpresTI/commit/2eff5e0) |

## 2. Uma suposição corrigida pelo operador

O agente começou com 14 dias corridos ao interpretar o texto do PRD.
O operador confirmou dias úteis, com feriados nacionais e horário de São Paulo.
A [spec 003](spec/003-catalogo-solicitacao.md#prazo-e-apresentação) registra a
decisão e os [testes de prazo](src/lib/emprestimos.test.ts) cobrem o cálculo.

## 3. Decisão sobre ADR

Uma coluna permitiria guardar uma referência arbitrária por equipamento e
exigiria uma migration. A chave derivada do UUID resolve o vínculo com o
bucket para o inventário fixo. A decisão ficou na
[spec 002](spec/002-dados-iniciais.md#decisões-e-pendências) porque é uma
convenção desta carga dentro da arquitetura do [ADR-001](docs/adr/001-stack.md).

## 4. Skill de fotos

O [Pixabay](spec/002-dados-iniciais.md#decisões-e-pendências) foi adotado
conforme a orientação do professor em aula. O catálogo exibe as fotos do
Storage. A origem, a autoria e a licença de cada uma ficam no
[manifesto](spec/entrega3-fotos.md).

O [`SKILL.md`](skills/imagens-equipamentos/SKILL.md) orienta a seleção,
a revisão visual, o preparo e a entrega dos JPEGs ao operador. As referências
da API e da licença ficam ligadas na própria skill. O
[script](skills/imagens-equipamentos/scripts/buscar-pixabay.mjs) automatiza
a busca e o cache de 24 horas. O [teste de fotos](tests/storage/fotos.test.ts)
confere os 12 patrimônios, a unicidade e as dimensões reais dos JPEGs
publicados. A revisão humana confirma se o objeto corresponde ao item e
procura pessoas, marcas, texto legível ou conteúdo de tela.

A chave do Pixabay serve à busca local. O procedimento reserva a
credencial de escrita no Storage ao operador, que publica as imagens.
O teste de acesso usa GET anônimo.

O [manifesto](spec/entrega3-fotos.md#revisão) registra seis candidatas
descartadas, uma por ser ilustração, quatro por marcas ou texto em destaque
e uma por divergir da resolução do item. Em 10/11/2026, a revisão dos
JPEGs publicados encontrou inscrições legíveis em `TI-0011` e `TI-0012`.
As duas fotos substitutas foram exportadas com a versão de `sharp` já
presente no Next e publicadas nas mesmas chaves com autorização do operador.
As fontes e os hashes constam no
[registro das substituições](spec/entrega3-fotos.md#substituições-publicadas-em-10112026).

## 5. Verificador

O [AGENTS.md](AGENTS.md) exige delegação antes de fechar a spec. O gatilho
foi escolhido para vincular o parecer à revisão que será entregue. O
verificador recebe a spec, o intervalo de commits e uma cópia descartável.
Em contexto limpo, lê as regras, os critérios e o diff para formar o próprio
parecer. Como o projeto é um monólito, a mesma revisão contém os testes da
interface, da API e do banco. O procedimento exige execução sem credenciais
reais, conectores de produção ou permissão de publicação. Quando o
isolamento não pode ser demonstrado, os checks ficam bloqueados.
[Procedimento](agents/verificador-spec.md)

## 6. Verificador em ação

Os commits estão na branch `feat/ensaio-verificador-sdd`. Os dois
pareceres e seus intervalos constam no [plano](spec/pratica-sdd-plano-de-acao.md#evidências-do-ensaio-local).

| Revisão | Check local | Parecer |
|---|---|---|
| `68cdb24deb5bf201617290f6d95fca6ead3d670a` | `CA-ENSAIO-01` falhou | `NÃO PRONTA` |
| `d2155b239f784d31ac242272b130f6b056a2b0a8` | `CA-ENSAIO-01` passou | `PRONTA` |

O erro plantado preservava espaços nas extremidades de um identificador.
Os dois pareceres completos e a correção estão no plano. Na revisão real
`2eff5e0`, ficaram as pendências abaixo.

| CA | Pendência na revisão `2eff5e0` | Evidência acrescentada em [`2812804`](https://github.com/lemosriosl/FutureEmpresTI/commit/2812804) |
|---|---|---|
| `CA-002-04` | Faltava teste reproduzível dos JPEGs publicados. | [Teste de Storage](tests/storage/fotos.test.ts) e resultado de GET público registrado abaixo. |
| `CA-003-01` | Faltava evidência reproduzível de login com Auth real. | [Fluxo Playwright](tests/catalogo/fluxo.spec.ts) com conta fictícia e Supabase Auth local. |
| `CA-003-02` | Faltava evidência da apresentação do catálogo e do detalhe. | O mesmo fluxo confere os 12 cartões, os estados, o filtro e as imagens. |

As [specs 002](spec/002-dados-iniciais.md) e [003](spec/003-catalogo-solicitacao.md)
registram os demais resultados parciais de `2eff5e0`. As tabelas finais
dependem de nova delegação sobre a revisão a publicar.

## 7. Uma regra posta à prova

O critério das fotos pede evidência do bucket público. A sessão do verificador
fica isolada do ambiente publicado. O procedimento agora separa o GET
anônimo, executado fora da sessão, da conferência do teste e da saída pelo
verificador. A regra preserva o isolamento da revisão.

## Execução local

Rode `pnpm db:generate` e `pnpm dev` com o `.env` do ambiente autorizado.
O login usa o Supabase Auth do projeto. O Prisma usa o PostgreSQL configurado,
e o catálogo lê as fotos do bucket descrito na spec 002. A suíte
`pnpm test:db` usa PostgreSQL descartável no Docker. Ela aplica a migration
versionada no contêiner e cria vínculos e empréstimos fictícios.

## Verificações registradas

Os resultados abaixo são históricos. Os testes de integração de 10/11/2026
incluíam o limitador local de login, removido em
[`5033851`](https://github.com/lemosriosl/FutureEmpresTI/commit/5033851).

| Check | Resultado |
|---|---|
| `pnpm test` | 9 testes aprovados na conferência de 10/11/2026. |
| `pnpm test:db` | 9 testes aprovados em PostgreSQL descartável em 10/11/2026, incluindo quinto pedido aceito, sexto recusado, concorrência pela última vaga, isolamento, controle de login e idempotência da carga. |
| `pnpm test:e2e` | 3 testes aprovados em Chromium, incluindo redirecionamento anônimo, envio do formulário e bloqueio de origem externa. |
| `pnpm test:e2e:catalogo` | 1 cenário aprovado em Chromium, com Supabase Auth e PostgreSQL descartáveis. O teste conferiu cookie `HttpOnly`, 12 cartões, filtro, detalhe, solicitação, vencimento e mudança para emprestado. |
| `pnpm lint` | Passou. |
| `pnpm build --webpack` | Compilação, verificação de tipos e geração das páginas passaram com configuração fictícia em 10/11/2026. O Turbopack encerrou seu subprocesso do PostCSS neste Windows. |
| Login no Supabase e na Vercel | Em 10/11/2026, a conta oficial entrou com a senha padrão e a conta de teste entrou com a credencial escolhida pelo operador. Ambas acessaram o catálogo e retornaram zero empréstimos após a remoção de um empréstimo fictício associado à conta oficial. O evento permanece na auditoria. [Registro da correção](spec/002-dados-iniciais.md#resultado-das-correções) |
| `pnpm test:photos` | Em 10/11/2026, um teste aprovado no bucket público `catalogo-equipamentos` do Supabase configurado para a Vercel. Confirmou 12 JPEGs distintos, com 800×600 e HTTP 200 anônimo. [Teste local da revisão](tests/storage/fotos.test.ts) e [manifesto](spec/entrega3-fotos.md). |
| Ação de empréstimo em tela estreita | O botão aparece antes da foto e abre a confirmação. A gravação foi conferida em PostgreSQL descartável. |

Na revisão documental de 11/11/2026, os nove testes unitários passaram.
O lint apontou um `require()` no
[script do ensaio](spec/ensaio-verificador/rodar.cjs), com a regra
`@typescript-eslint/no-require-imports`. O Turbopack interrompeu a
compilação no subprocesso do PostCSS. Com Webpack, a compilação e a
checagem de tipos passaram. A etapa de coleta de dados das páginas
parou com `EBUSY` ao ler um arquivo do Next em `node_modules`.

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

## 8. O que falta, o que ficou de fora e o que faria diferente

- O [ajuste de login](spec/003-catalogo-solicitacao.md#recuperação-do-login-publicado)
  usa os limites do Supabase Auth e remove a dependência do contador do
  aplicativo. Falta confirmar o login e o fluxo de empréstimo na Vercel com
  a revisão que será avaliada.
- Faltam os pareceres finais das duas specs e a confirmação da tag
  `entrega-pratica` no commit conferido.
- O Git registra um `.env` antigo, removido da árvore em
  [`34149d0`](https://github.com/lemosriosl/FutureEmpresTI/commit/34149d0).
  A verificação desta entrega confirma o caminho no histórico. A validade e
  a rotação das credenciais antigas ainda precisam ser confirmadas.
- Devolução, telas de Operações, reserva, renovação, e-mail e importação
  ficaram fora da prática.
- Numa próxima rodada, preparar o cenário completo de login e catálogo
  com Auth descartável antes do primeiro parecer. A primeira revisão já
  teria evidência reproduzível de `CA-003-01` e `CA-003-02`.
