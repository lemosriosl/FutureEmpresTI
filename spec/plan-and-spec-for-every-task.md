# Spec: execução completa de toda tarefa

## Objetivo

Auditar e alinhar as instruções do agente para que toda solicitação de trabalho
tenha plano visível, spec e execução acompanhada até os critérios de aceite,
independentemente de ser uma tarefa de interface.

## Escopo

- Revisar `AGENTS.md`, `rules/spec-flow.md`, `rules/checks.md` e as regras
  relacionadas de autorização, teste, operação e restrições.
- Explicitar plano visível antes das edições, spec como primeiro arquivo de
  entrega, decomposição em tarefas e acompanhamento de progresso.
- Distinguir conclusão normal de bloqueio real, sem parar após escrever plano ou
  spec.
- Preservar as autorizações de `rules/operacao.md`: criar arquivo é permitido
  com aviso posterior; ações que pedem aprovação continuam aguardando aprovação.
- Não alterar arquivos de interface ou outras mudanças preexistentes no worktree.

## Regras

- Apresentar ao usuário um plano curto antes de qualquer edição.
- Criar ou atualizar primeiro a spec, antes dos demais arquivos da tarefa.
- Após a spec, transformar critérios de aceite em tarefas executáveis e avançar
  por elas até concluir, reportando bloqueios concretos em vez de encerrar após
  o planejamento.
- Não inventar decisão de produto nem ultrapassar aprovações exigidas; pedir
  decisão somente para o ponto bloqueado e continuar o trabalho independente
  autorizado quando possível.
- Validar os critérios da spec e os checks aplicáveis antes de declarar pronto.

## Critérios de aceite

- As instruções deixam claro que plano e spec são etapas iniciais, não a entrega.
- O agente deve executar e acompanhar cada tarefa aprovada e cada critério de
  aceite, sem exigir confirmação para ações já autorizadas.
- Exceções e bloqueios são consistentes com PRD, ADR e `rules/operacao.md`.
- `rules/checks.md`, `rules/restrictions.md` e a seção de comunicação do
  `AGENTS.md` verificam conclusão do escopo, além da validação técnica.
- As alterações documentais passam em `git diff --check`.