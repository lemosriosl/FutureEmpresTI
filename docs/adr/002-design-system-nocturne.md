# ADR-002 — Direção visual Nocturne

| Item | Decisão |
|---|---|
| Status | Aceita |
| Data | 2026-10-02 |
| Referência normativa | [`layout.md`](../../layout.md) |
| Escopo | Identidade visual e padrões de interface do EmpresTI |

## Contexto

O EmpresTI precisa de uma linguagem visual única para login, catálogo, empréstimos e operações. O `layout.md` já define a especificação detalhada dessas telas, incluindo tokens, medidas, componentes, conteúdo e estados. O ADR-001 escolhe a stack e as tecnologias de implementação; esta decisão complementa essa arquitetura no domínio visual, sem alterá-la.

## Decisão

Adotar o design system Nocturne descrito em `layout.md` como padrão visual do EmpresTI:

- Interface exclusivamente em modo escuro, com fundo azul quase preto, superfícies distinguidas por bordas e escurecimento, e a paleta de tokens definida no layout.
- A primária `#001449` fica reservada a fundos profundos; `#5B7FE0` é a cor de ação visível. Ações primárias são contornadas, sem preenchimento sólido.
- Open Sans é a família tipográfica; os ícones seguem Phosphor Icons, conforme pesos e mapeamentos do layout.
- A organização do app usa sidebar de 236px e área principal, com navegação compartilhada entre Colaborador e Operações. As telas, hierarquia de informação, grids, controles e espaçamentos seguem as definições detalhadas de `layout.md`.
- Estados de equipamento e empréstimo usam os tratamentos semânticos definidos no layout. Regras de negócio obrigatórias devem permanecer perceptíveis na interface, sem substituir a validação no servidor.
- Foco de teclado deve ser visível. Transições são discretas, limitadas a 240ms e respeitam `prefers-reduced-motion`.
- Copy da interface é em português do Brasil, com tom operacional e datas no formato `dd/mmm`.

`layout.md` permanece como fonte dos valores exatos de cor, tipografia, medidas, conteúdo por tela e comportamento de componentes. Esta ADR registra a direção e os princípios, sem duplicar toda a especificação.

## Justificativas

- Um modo escuro e uma paleta consistente tornam as telas do mesmo produto reconhecíveis e reduzem variação de implementação.
- Separar fundo profundo de cor de ação mantém a primária da marca sem depender dela para texto ou controles de baixo contraste.
- Botões contornados, superfícies delimitadas por bordas e movimento contido mantêm o caráter operacional e denso do produto.
- Uma única fonte de detalhe visual evita que as decisões da ADR e os valores de tela se afastem com o tempo.
- Dar visibilidade às regras no produto ajuda a pessoa a entender limites e estados durante a operação; a regra continua sendo garantida por backend conforme a arquitetura do ADR-001.

## Alternativas descartadas

| Alternativa | Motivo do descarte |
|---|---|
| Modo claro ou alternância entre temas | O produto foi especificado para operar somente no modo escuro. |
| Primária escura como cor de texto ou de ação | `#001449` não tem contraste suficiente sobre as superfícies escuras; `#5B7FE0` é a cor de ação. |
| Botões primários preenchidos | Contraria o padrão contornado definido para o produto. |
| Sombras pesadas ou elevação por sombra | O layout prioriza bordas e diferenças sutis entre superfícies. |
| Criar uma especificação paralela de tokens e telas nesta ADR | Duplicaria `layout.md`, que já contém os valores e o detalhamento normativo. |

## Consequências

### O que fica mais fácil

- Reproduzir uma linguagem visual previsível nas telas de Colaborador e Operações.
- Revisar mudanças de interface comparando os valores e componentes com uma única especificação detalhada.
- Identificar divergências visuais sem reabrir decisões de stack.

### O que fica mais difícil

- Uma única paleta escura exige cuidado com contraste, hierarquia e foco em cada superfície.
- Alterações em tokens ou padrões compartilhados precisam atualizar `layout.md` e manter as telas consistentes.

### Pendências e limites

- A implementação da aplicação usa Tailwind/shadcn conforme o ADR-001; `layout.md` define os estilos de componente em classes Tailwind. A CSP continua sem `unsafe-inline`. O CSS local da demonstração estática não altera essa decisão.
- `layout.md` descreve principalmente molduras desktop e não define breakpoints ou o comportamento das telas estreitas. Esta ADR não inventa esses detalhes; eles devem ser especificados antes de implementar os respectivos layouts responsivos.
- As regras de negócio e autorização continuam definidas pelo PRD e pela arquitetura do ADR-001; elementos visuais não são barreira de segurança nem validação de regra.

## O que esta ADR não decide

- Stack, bibliotecas, estratégia de estilização ou composição de componentes, definidos pelo ADR-001.
- Regras de negócio, permissões, estados de domínio ou comportamento de API, definidos pelo PRD e ADR-001.
- Breakpoints, pontos de quebra ou composições para telas estreitas não detalhados em `layout.md`.
- Mudanças nos tokens e nas especificações de tela. Esses detalhes são mantidos em `layout.md`.
