# Spec: tela inicial, login e menu principal

## Objetivo

Criar uma demonstração visual estática do EmpresTI com tela de login, tela
inicial do aplicativo e menu principal, seguindo o design system Nocturne de
`layout.md`.

## Escopo

- Criar `index.html` com as telas estáticas ligadas por âncoras.
- Criar `styles.css` com os tokens visuais, responsividade e estados de foco/
  hover necessários.
- Exibir login, marca, navegação lateral, cabeçalho e resumo operacional da
  tela inicial.

## Restrições

- Não implementar autenticação, JavaScript, API, banco, rotas reais ou ações de
  negócio.
- Não criar dados sensíveis nem alterar schema/configuração do projeto.
- Usar português BR e o padrão visual descrito em `layout.md`: modo escuro,
  sidebar de 236px, botões contornados, cores Nocturne e espaçamento por gap.

## Critérios de aceite

- A abertura de `index.html` apresenta a tela de login sem dependência de
  servidor ou biblioteca externa obrigatória.
- O formulário possui e-mail, senha e botão visual de entrada, sem submissão
  funcional.
- A tela inicial possui menu principal com grupos Colaborador e Operações,
  item ativo, contador de empréstimos e resumo dos equipamentos.
- As telas permanecem legíveis em viewport estreita, sem rolagem horizontal.
- `git diff --check` não aponta erros.
