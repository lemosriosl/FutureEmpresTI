# Entrega da prática SDD

**Status** — O inventário oficial e as 12 fotos já estão no Supabase. A
revisão local aplica o briefing de empréstimos. A publicação da revisão e
os pareceres finais dependem do commit a entregar.

## Referências

- [Repositório no GitHub](https://github.com/lemosriosl/FutureEmpresTI)
- [Endereço da Vercel informado pelo repositório](https://futureempresti.vercel.app/).
  Em 10/11/2026, o catálogo redirecionou visitantes sem sessão para `/login`,
  que respondeu com HTTP 200. A tag `entrega-pratica` não estava no GitHub.
- [Plano da prática](spec/pratica-sdd-plano-de-acao.md)
- [Spec 002 · Dados iniciais](spec/002-dados-iniciais.md)
- [Spec 003 · Login, catálogo e solicitação](spec/003-catalogo-solicitacao.md)

## 1. Conflitos

| Pedido | Conflito | Decisão e motivo | Registro |
|---|---|---|---|
| Aceitar até cinco empréstimos | O PRD anterior fixava três. | O operador pediu para seguir o briefing. O PRD, as mensagens e os testes passam a usar cinco. | [PRD](docs/PRD.md#regras-que-operações-já-decidiu) e [spec 003](spec/003-catalogo-solicitacao.md#decisão-de-fechamento-da-prática) |
| Manutenção no inventário | A lista do HTML inclui `TI-0010`. O briefing marca apenas `TI-0004` e `TI-0007`. | Usar o briefing e a coluna aprovada da planilha. O cabo `TI-0010` entra disponível. | [Spec 002](spec/002-dados-iniciais.md#decisões-e-pendências) |
| Pexels e crédito visível | O Pexels deixou de funcionar para a prática. O briefing do catálogo pede retirar o texto de crédito. | A pedido do professor, buscar no Pixabay. Guardar fontes e autores no manifesto. O catálogo mostra a seleção hospedada no Storage. | [Spec 002](spec/002-dados-iniciais.md#decisões-e-pendências) e [manifesto](spec/entrega3-fotos.md) |
| Instalar `sharp` | A prática já tem um processo local de exportação e as regras exigem aprovação para nova dependência. | Exportar em 800×600 com ferramenta local e testar o JPEG publicado. | [Skill](skills/imagens-equipamentos/SKILL.md#preparar-e-entregar) e [CA-002-04](spec/002-dados-iniciais.md#revalidação-do-ca-002-04) |
| Escrever a senha no seed | As regras de segredos vedam credenciais no código e no histórico. | O operador configura a senha no Auth por entrada segura. A carga associa a conta confirmada ao tenant. | [Spec 002](spec/002-dados-iniciais.md#decisões-e-pendências) |
| O verificador corrige o teste | A correção tiraria a independência da revisão. | O verificador relata a falha. O agente principal corrige e solicita novo parecer em contexto limpo. | [Ensaio](spec/pratica-sdd-plano-de-acao.md#evidências-do-ensaio-local) |

## 1b. Lacunas

| Lacuna | Alternativas consideradas | Decisão e motivo |
|---|---|---|
| Contagem dos 14 dias | Dias corridos, dias de semana ou dias úteis com feriados. | Contar segunda a sexta, exceto feriados nacionais, e manter o horário da retirada em São Paulo. Atraso começa após esse instante. [Spec 003](spec/003-catalogo-solicitacao.md#prazo-e-apresentação) |
| Estado de demonstração anterior | Apagar itens, deixá-los no catálogo ou retirá-los de serviço. | Retirar os cinco itens aprovados do catálogo e preservar seus registros e o histórico. [Spec 002](spec/002-dados-iniciais.md#decisões-e-pendências) |
| Referência da foto | Nova coluna ou chave derivada do UUID. | Usar `equipamentos/<UUID>.jpg` para manter a referência estável sem mudar o schema. [Spec 002](spec/002-dados-iniciais.md#decisões-e-pendências) |

## 2. Uma suposição corrigida pelo operador

O agente começou com 14 dias corridos ao interpretar o texto do PRD.
O operador confirmou dias úteis, com feriados nacionais e horário de São Paulo.
A [spec 003](spec/003-catalogo-solicitacao.md#prazo-e-apresentação) registra a
decisão e os [testes de prazo](src/lib/emprestimos.test.ts) cobrem o cálculo.

## 3. Decisão de arquitetura

A referência da foto poderia virar uma coluna. A chave derivada do UUID
resolve o vínculo com o bucket para o inventário fixo. A convenção fica na
spec 002 e no manifesto, dentro da arquitetura do ADR-001.

## 4. Skill de fotos

O `SKILL.md` descreve a seleção, a revisão visual, o preparo e a publicação
pelo operador. O script concentra a consulta e o cache de 24 horas. A
spec e o manifesto documentam a convenção, a licença e as fontes. O teste
confere 12 patrimônios, arquivos distintos e dimensões reais. A revisão
humana decide se o objeto corresponde ao item e se a foto tem conteúdo
impróprio. O [manifesto](spec/entrega3-fotos.md#revisão) registra seis
candidatas descartadas, uma por ser ilustração, quatro por marcas ou texto
em destaque e uma por divergir da resolução do item.

O script de busca usa a chave do Pixabay para gerar resultados locais. A
credencial do Storage fica com o operador, que executa a publicação. A
verificação da URL usa GET anônimo.

A última revisão confirmou inscrições legíveis nos JPEGs publicados de
`TI-0011` e `TI-0012`. As duas substituições do Pixabay foram preparadas
com a versão de `sharp` presente no Next e publicadas nas mesmas chaves
com autorização do operador. As fontes e hashes públicos estão no
[manifesto](spec/entrega3-fotos.md#substituições-publicadas-em-10112026).

## 5. Verificador

O [AGENTS.md](AGENTS.md) exige delegação antes de fechar a spec. O verificador
recebe a spec, os dois hashes e uma cópia descartável da revisão. Ele lê as
regras e o diff em contexto limpo e confere os testes do monólito, da interface
ao banco local. O ambiente de revisão precisa ficar sem credenciais reais,
conectores de produção ou permissão de publicação. Se o isolamento não puder
ser demonstrado, os checks ficam bloqueados. [Procedimento](agents/verificador-spec.md)

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

| CA | Pendência na revisão `2eff5e0` | Evidência acrescentada na revisão local |
|---|---|---|
| `CA-002-04` | Faltava teste reproduzível dos JPEGs publicados. | [Teste de Storage](tests/storage/fotos.test.ts) e resultado de GET público nesta entrega. |
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

## Verificações locais

| Check | Resultado |
|---|---|
| `pnpm test` | 9 testes aprovados na conferência de 10/11/2026. |
| `pnpm test:db` | 9 testes aprovados em PostgreSQL descartável em 10/11/2026, incluindo quinto pedido aceito, sexto recusado, concorrência pela última vaga, isolamento, controle de login e idempotência da carga. |
| `pnpm test:e2e` | 3 testes aprovados em Chromium, incluindo redirecionamento anônimo, envio do formulário e bloqueio de origem externa. |
| `pnpm test:e2e:catalogo` | 1 cenário aprovado em Chromium, com Supabase Auth e PostgreSQL descartáveis. O teste conferiu cookie `HttpOnly`, 12 cartões, filtro, detalhe, solicitação, vencimento e mudança para emprestado. |
| `pnpm lint` | Passou. |
| `pnpm build --webpack` | Compilação, verificação de tipos e geração das páginas passaram com configuração fictícia em 10/11/2026. O Turbopack encerrou seu subprocesso do PostCSS neste Windows. |
| Login no Supabase e na Vercel | Em 10/11/2026, a conta oficial entrou com a senha padrão e a conta de teste entrou com a credencial escolhida pelo operador. Ambas acessaram o catálogo e retornaram zero empréstimos. |
| `pnpm test:photos` | Em 10/11/2026, um teste aprovado no bucket público `catalogo-equipamentos` do Supabase configurado para a Vercel. Confirmou 12 JPEGs distintos, com 800×600 e HTTP 200 anônimo. [Teste local da revisão](tests/storage/fotos.test.ts) e [manifesto](spec/entrega3-fotos.md). |
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

## 8. O que falta e o que ficou de fora

- O login usa os limites do Supabase Auth. A retirada do contador local
  elimina a dependência da migration de controle de tentativas para entrar.
- Parecer final do verificador sobre a revisão a publicar e validação do
  fluxo de solicitação na Vercel.

O código da prática está na branch `feat/plano-pratica-sdd`. O deploy e a
tag de entrega dependem de uma etapa de publicação. Devolução, telas de Operações,
reserva, renovação, e-mail e importação estão fora do escopo da prática.
