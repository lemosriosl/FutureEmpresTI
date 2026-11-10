# Plano de ação da prática SDD

## Objetivo

Entregar o verificador, a skill de imagens, as specs 002 e 003 e o
`ENTREGA.md`. A prática cobre login funcional, catálogo, solicitação de
empréstimo e consulta dos próprios empréstimos em aberto, conforme os itens
1 a 3 do [PRD](../docs/PRD.md).

Este é o plano da prática. Antes de implementar cada funcionalidade, registrar
as decisões na spec correspondente, aprovar a spec e desdobrar os critérios de
aceite em tarefas. Trabalhar em branch e seguir o fluxo de PR do projeto.
[Fluxo SDD](../rules/spec-flow.md)

## 1. Adaptar o subagente verificador

- [x] Configurar o verificador existente para rodar com contexto limpo, a
  partir do caminho da spec e do intervalo de commits. Tornar a verificação
  obrigatória antes de fechar cada spec.
- [x] Garantir no ambiente que ele possa ler código e rodar checks locais
  sem credenciais ou permissões de escrita em produção.
- [x] Plantar uma falha controlada em um critério com teste local. Guardar
  o parecer de reprovação, corrigir no agente principal e verificar de novo.
  Guardar as duas tabelas e os hashes do erro e da correção.

**Ponto de atenção.** O pedido para o verificador corrigir um teste quebrado
compromete a independência da revisão. A falha volta para o agente principal.
A spec só fecha com `Veredito: PRONTA`. [Verificador](../agents/verificador-spec.md)

**Evidência.** Tabelas comparáveis por critério de aceite e os dois commits
que demonstram que o erro foi detectado e removido.

### Escopo e critérios de aceite da etapa 1

Esta etapa altera o procedimento de revisão da prática. Ela não muda o
comportamento dos itens 1 a 3 do PRD.

| ID | Critério de aceite |
|---|---|
| CA-VER-01 | O agente principal delega em contexto limpo e informa a spec e o intervalo `BASE..HEAD`. O verificador inspeciona o diff e roda os checks sobre os arquivos da revisão `HEAD`. |
| CA-VER-02 | O verificador só executa checks em cópia isolada e sem credenciais reais, com bancos locais ou efêmeros quando aplicável. Checks obrigatórios indisponíveis ou inseguros impedem a aprovação. |
| CA-VER-03 | A spec só fecha com todos os critérios atendidos, checks aplicáveis aprovados e escopo respeitado. O verificador relata as falhas, e o agente principal corrige e solicita novo parecer. |
| CA-VER-04 | Dois pareceres independentes registram a reprovação da falha controlada e a aprovação da correção para o mesmo critério. A evidência final liga os pareceres aos commits da falha e da correção. |

Para ensaiar o fluxo antes dos commits, usar duas cópias locais de um exemplo
isolado com o mesmo teste. O ensaio usa a biblioteca padrão do Node, pois os
scripts de aplicação ainda não existem. Ele não substitui a evidência por
intervalo de commits nem os checks da aplicação previstos no ADR.

### Evidências do ensaio local

Dois subagentes foram chamados em contexto limpo, um para cada intervalo da
branch `feat/ensaio-verificador-sdd`. Cada cópia foi exportada da revisão
final com `git archive` e continha apenas a spec, as regras e o exemplo. O
runner passou somente `SystemRoot` ao processo de teste. O teste usou um
identificador fictício, sem rede ou banco.

#### Cópia com falha

Intervalo `ff3d8c2f208441ea65906fd796f87a70c87b26eb..68cdb24deb5bf201617290f6d95fca6ead3d670a`.

| CA | Evidência | Status | Observação |
|---|---|---|---|
| CA-ENSAIO-01 | `spec/ensaio-verificador/normalizar.test.mjs:5` | REPROVADO | A função devolveu `'  TI-0001  '`. O teste esperava `'TI-0001'`. |

- `node rodar.cjs` falhou com um teste reprovado e código de saída 1.
- `Veredito: NÃO PRONTA` — A função preserva os espaços nas extremidades do identificador.

#### Cópia corrigida

Intervalo `68cdb24deb5bf201617290f6d95fca6ead3d670a..d2155b239f784d31ac242272b130f6b056a2b0a8`.

| CA | Evidência | Status | Observação |
|---|---|---|---|
| CA-ENSAIO-01 | `spec/ensaio-verificador/normalizar.test.mjs:5` | ATENDIDO | O teste confirma que `normalizar.mjs:2` remove os espaços nas extremidades e preserva `TI-0001`. |

- `node rodar.cjs` passou com um teste aprovado e zero falhas.
- `Veredito: PRONTA` — O critério do ensaio foi atendido, o check passou e o diff ficou dentro do escopo.

Nenhum dos pareceres encontrou mudanças fora do escopo. Entre as duas cópias,
o agente principal mudou apenas o retorno para `identificador.trim()` e
conferiu que o teste permaneceu idêntico.

## 2. Preparar a skill `imagens-equipamentos`

- [x] Documentar o fluxo da busca e da revisão visual e validar o cache com
  uma resposta simulada, sem rede e sem uma chave real.
- [ ] Usar a API do Pixabay para buscar fotos. Manter a chave fora do Git,
  armazenar as respostas de busca em cache por 24 horas e registrar ID,
  página original, autor e licença por foto.
- [ ] Selecionar uma foto distinta por patrimônio. Revisar pessoas, marcas
  ou logos legíveis, textos e conteúdo em telas. Registrar o motivo das
  rejeições e verificar que cada arquivo final mede 800×600 pixels.
- [ ] Definir caminhos estáveis no bucket público do Supabase Storage e
  preparar os arquivos localmente. O operador publica as fotos aprovadas.

**Decisão.** O professor pediu Pixabay porque o Pexels não funcionou para
a prática. Os créditos ficam no manifesto e o catálogo mostra os JPEGs
selecionados do Storage. A busca da API ocorre durante a preparação.
[API do Pixabay](https://pixabay.com/api/docs/) · [Licença](https://pixabay.com/service/license-summary/)

**Ponto de atenção.** `sharp` não está previsto no ADR. Escolher na spec uma
forma de normalizar e conferir os arquivos. Qualquer nova dependência passa
pela regra de aprovação. [Restrições](../rules/restrictions.md) · [Operação](../rules/operacao.md)

**Evidência.** Manifesto com 12 fotos distintas, dimensões verificadas,
créditos e registro da revisão visual.

A skill e o buscador local passaram na validação de frontmatter, no check
de sintaxe e no ensaio com resposta simulada. O ensaio verificou filtros,
cache entre processos, expiração de 24 horas e erro 429 sem expor a chave.
A seleção e a revisão visual das fotos constam no [manifesto](entrega3-fotos.md).

O buscador local aceita `API_KEY_PIXABAY` do `.env` quando invocado com
`node --env-file=.env`. O prompt mascarado continua disponível para buscas
avulsas. A chave fica fora do cache e o `.env.example` contém um campo vazio.

## 3. Spec 002 · Dados iniciais

[Spec 002 em revisão](002-dados-iniciais.md)

- [ ] Aprovar a lista de patrimônios e situações. Definir como tratar os
  equipamentos de demonstração existentes para que o catálogo de correção
  mostre os 12 esperados e preserve os registros que precisem ser mantidos.
- [ ] Definir como persistir a referência à imagem. Caso exija mudança de
  schema, aprovar o DDL antes de gerar a migration via Prisma.
- [ ] Preparar carga idempotente por tenant e patrimônio. Vincular a conta
  identificada do professor a `suporte_ti` como colaborador, preservando os
  papéis das demais contas. Provisionar a senha pelo fluxo de Auth, com a
  credencial fora do código.
- [ ] Rodar a carga duas vezes em ambiente local ou de teste autorizado.
  Conferir contagens, vínculos, imagens e ausência de empréstimos para o
  professor. Submeter a spec ao verificador.

**Decisão.** `TI-0004` e `TI-0007` ficam em manutenção. `TI-0010` fica
disponível conforme o briefing e a planilha aprovada.

**Ponto de atenção.** O seed de demonstração atribui papéis pela ordem de
criação das contas e pode criar empréstimos para a primeira. A carga da
prática precisa preservar a regra de **zero empréstimos** para o professor
e evitar restaurar o estado inicial de um item em uso ao ser repetida.
[Seed atual](../prisma/seed.ts) · [Migrations](../rules/migrations.md)

**Evidência.** Duas execuções da carga com o mesmo resultado esperado,
12 imagens acessíveis sem login no ambiente de validação e parecer da spec.

## 4. Spec 003 · Catálogo e solicitação

[Spec 003 em revisão](003-catalogo-solicitacao.md)

- [ ] Confirmar o estado do deploy e planejar o scaffold necessário. No
  repositório local, o HTML é um protótipo. Integrar o login com Supabase Auth
  e implementar as rotas pelo monolito previsto no ADR.
- [ ] Exibir os 12 equipamentos com foto, categoria e situação. Ao solicitar
  um item disponível, criar o empréstimo imediatamente. Mostrar somente os
  empréstimos em aberto da pessoa logada e a data prevista de devolução.
- [ ] Validar no servidor disponibilidade, limite, atraso e isolamento por
  tenant. Testar os conflitos de concorrência com PostgreSQL real, rodar os
  checks e submeter a spec ao verificador.

**Decisão.** O operador pediu o limite de **5 itens** do briefing, agora no
PRD. O prazo é de **14 dias úteis**. Contam segunda a sexta, exceto feriados nacionais,
com vencimento no horário da retirada em São Paulo. O atraso compara o
vencimento com o instante atual. [PRD](../docs/PRD.md) · [Modelo](modelo-banco-prd.md)

**Ponto de atenção.** O banco impede dois empréstimos abertos do mesmo item.
Também testar dois pedidos simultâneos de itens diferentes por um usuário
com quatro empréstimos abertos. Só um pedido deve passar em cada cenário.
[Migration inicial](../prisma/migrations/20261019000000_init/migration.sql)

**Evidência.** Testes de login, catálogo, manutenção, limite, atraso,
concorrência e isolamento entre tenants. Rodar os checks na ordem do
projeto e registrar o parecer final. [Checks](../rules/checks.md)

## 5. Validar produção e fechar o `ENTREGA.md`

### Fechamento autorizado

O operador autorizou substituir os objetos de `TI-0011` e `TI-0012`, criar
o commit da prática, abrir o PR, publicar a revisão e enviar a tag
`entrega-pratica`. Verificar os hashes dos dois JPEGs novos e guardar cópias
dos objetos atuais antes de substituir. Conferir os 12 JPEGs via GET anônimo
e atualizar o manifesto com as fontes efetivamente publicadas.

Executar os checks da revisão, criar o commit e enviar o intervalo e uma
cópia isolada ao verificador. Publicar somente a revisão aprovada. Antes de
promover a Vercel, confirmar a configuração de login e que a migração
versionada passou pelo fluxo Prisma no GitHub Actions. Conferir a revisão
servindo em produção, o login e o catálogo com leitura. A tag deve apontar
para o commit verificado e publicado. Validar o fluxo de gravação de
empréstimo nos serviços locais descartáveis.

A revisão atual vai ao GitHub em `feat/plano-pratica-sdd`. A branch
`feat/ensaio-verificador-sdd` acompanha a revisão para que os hashes dos
pareceres possam ser conferidos. Conferir os arquivos do commit, os checks
locais e as referências publicadas. O deploy e a tag ficam para a publicação
da aplicação.

- [ ] Após revisão e aprovação, publicar pelo fluxo do projeto. O operador
  executa as escritas em Auth, banco e Storage de produção. Se houver
  migration, usar o fluxo autorizado do projeto.
- [ ] Conferir na Vercel login, 12 fotos, estados, solicitação, data de
  devolução e mensagem de limite. Fazer os empréstimos de verificação com
  uma conta própria e confirmar que o professor chega à correção com zero
  empréstimos.
- [ ] Completar o `ENTREGA.md` na raiz com links do GitHub e da Vercel,
  conflitos, lacunas, alternativas, decisões, registro da revisão das
  fotos, pareceres e hashes verificáveis. Incluir uma suposição real do
  agente corrigida pelo operador, uma decisão sobre ADR, uma regra do
  projeto posta à prova e o que ficou de fora.
- [ ] Com a versão final revisada, criar e publicar a tag `entrega-pratica`
  quando solicitado.

**Ponto de atenção.** A tag fixa o commit avaliado. Conferir que o
`ENTREGA.md` está nesse commit e que o comportamento na Vercel corresponde
às specs. A prática exclui devolução, telas de Operações, reserva futura,
renovação, e-mail e importação de planilha.

**Evidência.** Links da entrega, tag no commit revisado, checklist de
produção preenchido e evidências rastreáveis no `ENTREGA.md`.
