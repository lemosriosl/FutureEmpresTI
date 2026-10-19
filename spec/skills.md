# Spec: skills da aula 10

## Objetivo

Adicionar ao repositório as três skills sugeridas pela aula 10, mantendo as
decisões de negócio, arquitetura, testes e design nas fontes normativas já
existentes.

## Escopo

- Criar `skills/revisar-design/SKILL.md` para revisão de services e módulos.
- Criar `skills/graficos-operacoes/SKILL.md` para orientar a escolha e a
  implementação de gráficos quando uma spec tiver critério de aceite para isso.
- Criar `skills/ilustracao-equipamento/SKILL.md` para orientar ilustrações de
  equipamentos conforme o design system.
- Criar `skills/principios-solid/SKILL.md` para orientar revisões de design com
  os princípios SOLID.
- Adicionar ao `AGENTS.md` a seção que anuncia `skills/<nome>/SKILL.md` e a
  carga progressiva das skills.
- Não criar `.mcp.json`, não instalar dependências e não alterar regras,
  ADRs, PRD, schema, migrations ou comportamento do produto.

## Critérios de aceite

- Cada skill tem uma pasta única e um `SKILL.md` com `name` e `description`.
- O `name` coincide com o nome da pasta e usa kebab-case.
- As skills apontam para `rules/`, `docs/adr/` e `layout.md` em vez de repetir
  decisões já tomadas.
- Cada skill exige spec/critério de aceite quando a atividade produzir código
  e para quando faltarem essas entradas.
- `AGENTS.md` descreve a localização e a carga progressiva das skills.
- Nenhum MCP é configurado nesta tarefa.

## Validação

- Conferir frontmatter, correspondência pasta/name e unicidade de `SKILL.md`.
- Procurar segredos, `.mcp.json` e duplicação de skills.
- Executar `git diff --check`.
- Como o repositório não possui `package.json` nem scripts, não declarar
  validação de aplicação.
