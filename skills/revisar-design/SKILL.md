---
name: revisar-design
description: Revise services, routers e módulos TypeScript do backend por responsabilidade, acoplamento e code smells antes de um commit. Use quando alguém pedir revisão de design, SOLID, responsabilidade de classe ou qualidade estrutural de código de servidor neste projeto. Não use para decidir arquitetura, requisitos, critérios de aceite ou a estratégia de testes; consulte o ADR-001, a spec e rules/test.md.
---

# Revisar design de backend

## Antes de começar

1. Confirme que existe uma spec ou tarefa aprovada e identifique o critério de aceite relacionado ao código revisado. Sem isso, pare e peça a spec.
2. Leia o ADR-001 para respeitar `router → service → Prisma` e a separação de responsabilidades definida pelo projeto.
3. Leia apenas as rules aplicáveis ao arquivo, especialmente `rules/restrictions.md`, `rules/operacao.md` e `rules/test.md`.

## Procedimento

1. Liste a responsabilidade principal de cada módulo e as dependências que ele recebe.
2. Procure mistura de transporte, regra de negócio, persistência, autorização ou formatação na mesma unidade.
3. Procure duplicação, acoplamento desnecessário, funções difíceis de testar e abstrações sem uso real.
4. Relacione cada achado a um arquivo e linha, explique o impacto e proponha a menor mudança compatível com a spec.
5. Não aplique refatoração, mudança de arquitetura ou mudança de regra sem pedido explícito e sem atualizar a spec quando necessário.

## Verificação

1. Confirme que os achados não contradizem o ADR-001 nem repetem decisões de `rules/`.
2. Aponte os testes aplicáveis conforme `rules/test.md`; não invente cobertura.
3. Se nenhuma violação relevante existir, diga isso e registre quais camadas foram examinadas.

## Não faça

- Não impor uma arquitetura alternativa ao monolito do ADR-001.
- Não transformar preferência de estilo em requisito do produto.
- Não substituir a validação de negócio por uma sugestão de design.
