# Spec 002 · Dados iniciais

**Status** — Inventário, conta do professor e 12 fotos conferidos no
Supabase. O parecer final sobre o intervalo de commits segue pendente.

## Escopo

Preparar o catálogo inicial do tenant `suporte_ti` para a prática e vincular
a nova conta indicada para o professor como colaborador. A carga da prática é separada
do seed demonstrativo, que atribui papéis pela ordem de criação e inclui
empréstimos fictícios. A carga da prática não cria empréstimos.

## Decisões e pendências

- O operador confirmou a aprovação do Pixabay pelo professor. O enunciado
  original exigia Pexels. A interface exibe **Fotos: Pixabay** com link.
- Usar os 12 registros da planilha `lista_12_equipamentos_entrega3.xlsx` e a
  coluna **Situação Entrega 3**. `TI-0004` e `TI-0007` entram em manutenção.
  `TI-0010` é um cabo de rede de 3 m e entra disponível conforme essa coluna.
- O operador autorizou retirar os cinco itens atuais. A carga marca os itens
  demonstrativos como `OUT_OF_SERVICE`, e o catálogo oculta esse estado.
  Assim, o tenant mantém os registros e o histórico. A carga para caso encontre
  outro patrimônio ou empréstimos em aberto nos itens a retirar.
- Proposta de referência sem migration. O operador publica cada JPEG em
  `equipamentos/<equipment.id>.jpg` no bucket público `catalogo-equipamentos`. O UUID
  existente é a chave estável. O manifesto liga o patrimônio ao arquivo
  local e a carga fornece o mapa patrimônio → UUID para a publicação. A
  aprovação dessa convenção inclui o nome do bucket no ambiente de teste.
- Criar a conta indicada pelo operador no Supabase Auth, com a senha fornecida
  por entrada segura. A carga recebe a identidade
  aprovada e valida a existência da conta antes de vinculá-la. Se a conta já
  tiver outro papel no tenant ou qualquer empréstimo, a carga informa o
  conflito e para para decisão do operador.

## Critérios de aceite

| ID | Evidência esperada |
|---|---|
| CA-002-01 | O catálogo do ambiente de validação contém exatamente os 12 itens aprovados, únicos por tenant e patrimônio, com as situações iniciais aprovadas. |
| CA-002-02 | Duas execuções mantêm UUIDs, quantidades e vínculos estáveis. A repetição preserva estado operacional alterado, empréstimo em curso e dados de outros tenants. |
| CA-002-03 | A conta aprovada do professor tem papel `COLLABORATOR` em `suporte_ti` e zero empréstimos. Os papéis das outras contas permanecem iguais. |
| CA-002-04 | O manifesto contém 12 fotos distintas, autores, páginas, licença e revisão. Os JPEGs medem 800×600 e são acessíveis sem login no ambiente de validação. |

## Tarefas e validação

1. Aprovar inventário, destinação dos itens demonstrativos e referência de
   Storage. Identificar a conta Auth por um canal autorizado.
2. Preparar fotos e manifesto conforme a skill `imagens-equipamentos`.
3. Implementar a carga transacional por tenant e patrimônio. Aplicar o estado
   inicial apenas na inserção. Verificar as pré-condições antes das escritas.
4. Rodar a carga duas vezes em PostgreSQL local ou de teste autorizado, com
   verificação de empréstimo em curso e tenant distinto. O operador publica
   as imagens no ambiente aprovado e o check verifica as dimensões e o acesso.
5. Rodar os checks do projeto e enviar o intervalo de commits ao verificador.

## Conferência do Supabase existente

Antes de preparar uma carga, consultar o projeto configurado em modo somente
leitura. Comparar os patrimônios, situações, fotos, vínculos e permissões
existentes com os critérios de aceite. Reutilizar registros que já atendam à
prática e registrar as divergências que ainda precisem de decisão. O estado
atual do banco é evidência do cadastro, não da lista oficial da avaliação.
Validar ajustes locais com os checks aplicáveis e manter as escritas remotas
sob o procedimento da prática.

Em 09/11/2026, a consulta ao projeto configurado confirmou que `suporte_ti`
tem 5 equipamentos e nenhum patrimônio no padrão `TI-0001`. Nenhuma conta
Auth está vinculada ao tenant e o projeto ainda não tem bucket de Storage.
A leitura do catálogo com o papel `authenticated` e o contexto de tenant
retornou os mesmos 5 itens. A consulta também confirmou os grants esperados
para o domínio, sem executar inserções.

O catálogo usa o tenant e o schema existentes. As 12 imagens do Pixabay
estão no bucket público e foram verificadas sem autenticação.
[Manifesto de fotos](entrega3-fotos.md)

## Resultado da carga

A carga marcou os 5 itens demonstrativos como fora de uso e confirmou os 12
patrimônios `TI-0001` a `TI-0012`. O catálogo tem 10 itens disponíveis e 2
em manutenção. A segunda execução devolveu os mesmos UUIDs e estados, com
zero novas retiradas.

O comando `pnpm db:seed:entrega3 --catalogo` aplica a carga ao banco
configurado. Após criar e confirmar a conta no Supabase Auth,
`pnpm db:seed:entrega3 --professor <email>` cria o vínculo, desde que a conta
tenha zero empréstimos e seus vínculos sejam compatíveis.

A conta indicada foi criada e confirmada no Supabase Auth. O vínculo em
`suporte_ti` tem papel `COLLABORATOR`. O login local retornou os 12 itens do
catálogo e zero empréstimos para a conta.

[Plano da prática](pratica-sdd-plano-de-acao.md) · [PRD, item 2](../docs/PRD.md) · [Buckets do Supabase](https://supabase.com/docs/guides/storage/buckets/fundamentals)
