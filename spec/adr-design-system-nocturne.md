# Spec: ADR do design system Nocturne

## Objetivo

Registrar em uma nova ADR as decisões de interface e identidade visual do EmpresTI, usando `layout.md` como referência aprovada e fonte dos detalhes de implementação.

## Escopo

- Criar `docs/adr/002-design-system-nocturne.md` com contexto, decisões, justificativas, alternativas e consequências.
- Documentar o modo escuro Nocturne, paleta, tipografia, componentes, navegação, comportamento responsivo e acessibilidade conforme `layout.md`.
- Manter `layout.md` como especificação detalhada de telas, tokens, medidas e conteúdo.

## Restrições

- Não alterar o ADR-001, o layout, o PRD ou o código da aplicação.
- Não introduzir dependências ou decisões de stack; respeitar o ADR-001.
- Não inventar comportamento de negócio nem criar uma segunda fonte de verdade para detalhes visuais já definidos no layout.

## Critérios de aceite

- A nova ADR tem numeração seguinte à ADR existente e identifica `layout.md` como referência normativa dos detalhes visuais.
- As decisões e consequências são coerentes com o `layout.md` e não contradizem o ADR-001.
- `git diff --check` não aponta erros de whitespace nos documentos alterados.
