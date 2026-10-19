---
name: graficos-operacoes
description: Escolha e implemente gráficos para perguntas de Operações no frontend do EmpresTI. Use quando uma spec ou critério de aceite pedir um gráfico, indicador ou visualização sobre equipamentos ou empréstimos e a pergunta de negócio estiver explícita. Não use para inventar métricas, decidir escopo, escolher a biblioteca ou substituir o design system definido no ADR-002 e em layout.md.
---

# Gráficos de Operações

## Antes de começar

1. Localize a spec e o critério de aceite que pedem a visualização. Sem pergunta de negócio e CA, pare; uma tela não ganha gráfico por iniciativa da skill.
2. Confirme no PRD quais dados pertencem ao fluxo de Operações e não exponha dados de outro tenant.
3. Consulte o ADR-002 e `layout.md` para tokens, tipografia, estados, foco e comportamento responsivo. A skill não cria paleta nem biblioteca.

## Procedimento

1. Reescreva a pergunta em uma frase mensurável e identifique dimensão, medida, período e estado dos dados.
2. Escolha a menor visualização que responda à pergunta: comparação entre categorias, evolução no tempo, composição ou lista/indicador quando um gráfico não acrescentar informação.
3. Defina estados de carregamento, vazio, erro e dados insuficientes conforme o contrato da tela.
4. Implemente o componente no caminho de frontend previsto pelo ADR-001, usando dados tipados do AppRouter e sem criar dados fictícios para mascarar ausência de backend.
5. Mantenha legenda, texto alternativo, foco de teclado, contraste e leitura em viewport estreito compatíveis com o ADR-002.

## Verificação

- Cada série, rótulo e filtro responde ao CA da spec.
- Valores e agregações vêm do contrato da aplicação; não são inferidos de exemplos inventados.
- A visualização tem estados de carregamento, vazio e erro.
- A tela continua legível sem depender apenas de cor ou movimento.
- Aponte os testes de frontend aplicáveis conforme `rules/test.md`.

## Não faça

- Não criar métrica, filtro ou gráfico que a spec não pediu.
- Não escolher cor, ícone ou biblioteca contrariando ADR-002, layout.md ou ADR-001.
- Não fazer consulta direta ao Prisma a partir do frontend.
