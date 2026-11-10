# Spec 002 · Dados iniciais

**Status** — O verificador aprovou CA-002-01 a CA-002-03 em `2eff5e0`.
O CA-002-04 ficou sem teste reproduzível. A rodada de correções acrescenta
esse teste e será submetida a novo parecer depois do commit.

## Escopo

Preparar o catálogo inicial do tenant `suporte_ti` para a prática e vincular
a nova conta indicada para o professor como colaborador. A carga da prática é separada
do seed demonstrativo, que atribui papéis pela ordem de criação e inclui
empréstimos fictícios. A carga da prática não cria empréstimos.

## Decisões e pendências

- O operador confirmou que o professor pediu Pixabay porque o Pexels não
  estava funcionando para a prática. A busca ocorre na preparação das fotos.
  O catálogo exibe os JPEGs selecionados do Storage e os créditos ficam no
  [manifesto](entrega3-fotos.md). A [API do Pixabay](https://pixabay.com/api/docs/)
  pede crédito onde seus resultados de busca são exibidos. A
  [licença das fotos](https://pixabay.com/service/license-summary/) permite
  usar as imagens preparadas sem atribuição na tela.
- Manter a exportação local em JPEG de 800×600 já usada na prática. A
  verificação dos arquivos publicados comprova dimensões e unicidade sem
  adicionar uma biblioteca à aplicação.
- A revisão dos arquivos da webcam e da câmera compacta encontrou texto
  legível. As duas substituições do Pixabay foram publicadas nas chaves
  existentes com autorização do operador. O manifesto registra as novas
  fontes e os hashes dos JPEGs, verificados pelo teste público.
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

### Revalidação do CA-002-04

Adicionar `pnpm test:photos` para comparar o inventário com o manifesto e
verificar os 12 JPEGs publicados. O teste faz GET anônimo, sem chaves,
sem cookies e sem redirecionamento. Confere o formato, as dimensões reais e
a unicidade dos arquivos. A origem é o endereço público configurado em
`NEXT_PUBLIC_SUPABASE_URL`. Rodar separadamente dos testes que usam apenas
serviços descartáveis. Entregar ao verificador a saída do teste de leitura
pública, a data, o ambiente consultado e a revisão do teste para conferir
`CA-002-04` sem conceder acesso remoto ao verificador.

### Revalidação das contas da prática

Conferir separadamente a identidade oficial do enunciado, o vínculo em
`suporte_ti` e os empréstimos em aberto e históricos. Verificar a senha
padrão por meio seguro, sem registrar seu valor, e distinguir o ambiente
consultado do ambiente publicado na Vercel.

- A conta oficial deve aceitar a senha padrão da turma, ter papel
  `COLLABORATOR` e chegar à correção com zero empréstimos.
- A conta de teste solicitada deve ter um vínculo `COLLABORATOR` no mesmo
  tenant, permitir login com a credencial fornecida ao operador e começar
  sem empréstimos. Usar o cadastro administrativo previsto no ADR-001.
- O operador executa o provisionamento remoto. Antes de corrigir qualquer
  empréstimo associado à conta oficial, identificar se o registro é de
  teste ou corresponde a uma retirada real.

#### Conferência de 10/11/2026

A consulta somente leitura ao Supabase configurado confirmou a conta oficial
como `COLLABORATOR` em `suporte_ti`. A senha atual diverge da senha padrão e
há um empréstimo em aberto de `TI-0001`, registrado em 09/11/2026 às 10h42
no horário de São Paulo. O operador confirmou que foi um teste sem retirada
física. A conta de teste solicitada ainda não existia no Auth.

#### Procedimento de correção

Nesta rodada, o operador autorizou a execução das três correções pontuais no
Supabase configurado. Revalidar as contas e o registro de teste antes da
escrita. Após provisionar e vincular a conta de teste, restaurar a senha do
professor e remover somente o empréstimo confirmado, conferir ambas as
credenciais e o total de empréstimos por conta.

1. No Supabase, abra **Authentication → Users → Add user → Create new user**.
   Cadastre o e-mail da conta de teste com a senha fornecida e confirme o
   e-mail no cadastro. Na raiz do projeto, execute
   `pnpm db:seed:entrega3 --professor <email-da-conta-de-teste>`.
   Esse comando vincula a conta confirmada como `COLLABORATOR` em `suporte_ti`,
   apesar do nome da opção. Ele valida que a conta tem zero empréstimos.
2. Em **Authentication → Users**, copie o UUID da conta oficial. Com o
   `.env` do projeto e PowerShell 7, execute o bloco abaixo. Digite a senha
   padrão indicada no enunciado quando o terminal pedir. A senha entra pelo
   prompt mascarado e a chave administrativa `SUPABASE_SECRET_KEY` é lida do `.env`.

   ```powershell
   $professorUid = Read-Host 'UUID da conta oficial do professor'
   $redefinirSenha = @'
   import { createClient } from '@supabase/supabase-js';
   import { readFileSync } from 'node:fs';

   const id = process.argv[1];
   const auth = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.SUPABASE_SECRET_KEY,
     { auth: { persistSession: false, autoRefreshToken: false } },
   ).auth.admin;
   const { data, error } = await auth.getUserById(id);
   if (error || data.user?.email?.toLowerCase() !== 'marcelo.grilo@institutojef.org.br') {
     console.error('UUID incompatível com a conta oficial.');
     process.exit(1);
   }
   const password = readFileSync(0, 'utf8').replace(/\r?\n$/, '');
   const result = await auth.updateUserById(id, { password });
   if (result.error) {
     console.error(`Falha no Auth (${result.error.code ?? result.error.status}).`);
     process.exit(1);
   }
   console.log('Senha da conta oficial atualizada.');
   '@
   (Read-Host 'Senha padrão da turma' -MaskInput) |
     node --env-file=.env --input-type=module -e $redefinirSenha -- $professorUid
   ```

3. No SQL Editor do projeto conferido, execute o bloco a seguir para remover
   exclusivamente o empréstimo fictício confirmado. O `RETURNING` deve mostrar
   um registro na primeira execução. A auditoria original permanece no banco.
   A disponibilidade do item é calculada pelos empréstimos em aberto.

   ```sql
   DELETE FROM public.loans AS l
   USING public.tenants AS t, public.equipment AS e, auth.users AS u
   WHERE t.slug = 'suporte_ti'
     AND l.tenant_id = t.id
     AND e.tenant_id = t.id AND e.id = l.equipment_id
     AND e.patrimonio = 'TI-0001'
     AND u.id = l.borrower_id AND lower(u.email) = 'marcelo.grilo@institutojef.org.br'
     AND l.borrowed_at = TIMESTAMP '2026-11-09 13:42:56.104'
     AND l.returned_at IS NULL
     AND EXISTS (
       SELECT 1 FROM public.audit_logs AS a
       WHERE a.tenant_id = t.id AND a.resource_id = l.id AND a.actor_id = u.id
         AND a.action = 'REQUEST_LOAN' AND a.resource_type = 'Loan'
     )
   RETURNING l.id;
   ```

4. Confira zero empréstimos para a conta oficial no Supabase. No link da
   Vercel, confira que a conta de teste entra e abre o catálogo. Use essa
   conta para qualquer teste que crie empréstimos.

#### Resultado das correções

Em 10/11/2026, a conta de teste foi criada e vinculada como `COLLABORATOR`
em `suporte_ti`. A senha padrão da conta oficial foi restaurada e somente o
empréstimo fictício de `TI-0001` foi removido. As duas contas fizeram login
na Vercel, acessaram o catálogo e receberam zero empréstimos em
**Meus empréstimos**. O evento original permanece na auditoria.

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
