# Spec: consolidar regras e corrigir protótipo

## Objetivo

Remover contradições e repetições apontadas na auditoria, alinhar as instruções do agente e corrigir a seleção de telas do protótipo em viewport mobile.

## Escopo

- Atualizar `AGENTS.md`, `rules/restrictions.md`, `rules/operacao.md`, `rules/checks.md`, `rules/migrations.md`, `rules/spec-flow.md`, `rules/test.md` e o ADR-001 para estabelecer fontes únicas e coerentes.
- Manter `rules/secrets.md` como autoridade para variáveis; a matriz de operação não deve impedir os passos locais definidos ali, sem permitir mudanças remotas.
- Remover a proibição geral de criar ADR e incluir a ADR-002 na documentação e precedência.
- Corrigir a exibição exclusiva de login ou app no protótipo mobile em `styles.css`.
- Não alterar dados de ambiente, serviços remotos, dependências ou comportamento de negócio.

## Decisão aplicada

Preservar Tailwind/shadcn e a CSP restritiva, conforme escolha do usuário. Atualizar a nota de implementação de `layout.md` para usar classes Tailwind e limitar CSS global customizado; não permitir atributos de estilo inline na CSP.

## Critérios de aceite

- Regras de ADR, autorização, validação e testes têm uma fonte normativa clara, sem instruções incompatíveis ou sequências repetidas que divirjam.
- A ordem dos checks para mudanças de schema é migration/reset antes de testes; para as demais tarefas, os checks aplicáveis seguem a regra geral.
- As escolhas já registradas no ADR-001 não são chamadas de "não decididas" nas justificativas.
- No mobile, `#app` exibe somente o app e `#login` (ou ausência de hash) não força a exibição do app.
- `layout.md`, ADR-001 e ADR-002 concordam em usar Tailwind e manter a CSP sem `unsafe-inline`.
- Documentos passam em `git diff --check`; confirmar estado final com `git status --short`.
