# AGENTS.md — EmpresTI (FutureEmpresTI)

Guia operacional para agentes de IA que trabalham neste repositório.
Leia este arquivo antes de editar código ou propor mudanças estruturais.

---

## 1. O produto

**EmpresTI** substitui a planilha de controle de equipamentos internos (notebooks,
monitores, cabos, câmeras). Colaboradores pedem e devolvem itens; Operações
cadastra equipamentos e acompanha empréstimos em aberto.

### Personas

| Persona | O que faz na v1 |
|---|---|
| **Colaborador** | Login, catálogo, solicitar empréstimo, devolver item, ver os próprios empréstimos |
| **Operações** | Cadastrar equipamentos, ver todos os empréstimos em aberto, registrar devolução no balcão |

### Critério de sucesso do produto

Operações consegue abandonar a planilha depois de duas semanas de uso real
([docs/PRD.md](docs/PRD.md)).

---

## 2. Documentação e precedência

| Documento | Papel |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Comportamento de negócio e escopo da v1 |
| [docs/adr/001-stack.md](docs/adr/001-stack.md) | Stack, padrões técnicos e decisões irreversíveis |
| [layout.md](layout.md) | Design system Nocturne, telas, rotas e copy |
| [docs/perguntas-prd.md](docs/perguntas-prd.md) | Ambiguidades ainda não decididas pelo time |
| [rules/restrictions.md](rules/restrictions.md) | Limites rígidos do agente |
| [rules/checks.md](rules/checks.md) | Verificação antes de declarar tarefa pronta |
| [rules/migrations.md](rules/migrations.md) | Procedimento para mudança de schema (Prisma) |
| [rules/secrets.md](rules/secrets.md) | Variáveis de ambiente e chaves Supabase/Prisma |

**Ordem de precedência em conflito:**

1. Segurança e isolamento de tenant (sempre prevalece)
2. ADR-001 para decisões técnicas
3. PRD para regras de negócio
4. `layout.md` para interface
5. Este `AGENTS.md` como síntese operacional

Se algo estiver ambíguo no PRD, consulte `docs/perguntas-prd.md`. Se ainda
não houver resposta, **pare e pergunte** — não invente comportamento.

**Não escreva ADR.** Descreva a decisão e as alternativas e espere o time.

---

## 3. Regras de negócio (v1)

Estas regras já foram decididas por Operações e devem aparecer no código e na UI:

1. **Limite de 3 itens** — cada pessoa pode ter no máximo 3 empréstimos ativos
   ao mesmo tempo.
2. **Prazo de 14 dias** — devolução prevista calculada a partir da retirada.
3. **Atraso bloqueia** — quem tem item em atraso não pode solicitar outro.
4. **Manutenção invisível** — equipamento em manutenção não aparece como
   disponível no catálogo.

### Funcionalidades obrigatórias na v1

1. Login (cadastro fechado, somente por convite de administrador)
2. Catálogo com situação de cada equipamento
3. Solicitar empréstimo de item disponível
4. Devolver item que está comigo
5. Tela de Operações com empréstimos em aberto

### Fora de escopo na v1 (não implementar sem confirmação)

- Reserva com data futura
- Notificação por e-mail
- Importação da planilha atual
- Qualquer feature não listada no PRD

---

## 4. Stack

Monólito Next.js com App Router, TypeScript `strict`, tRPC, Prisma,
PostgreSQL (Supabase), Supabase Auth, TanStack Query, React Hook Form +
zodResolver, Tailwind CSS, shadcn/ui.

| Camada | Escolha |
|---|---|
| API | tRPC em `app/api/trpc/[trpc]/route.ts` |
| Organização | Por domínio: `src/server/api/routers/<dominio>.ts` |
| Camadas de código | Router (procedimento) → Service → Prisma |
| Estado de servidor | TanStack Query via `@trpc/react-query` |
| Estado de cliente | `useState` / Context — sem Redux/Zustand |
| Serialização | superjson |
| Testes | Vitest + Testing Library + Testcontainers (Postgres real) |
| E2E | Playwright para fluxos críticos de interface |
| Deploy | Vercel (Hobby), um projeto |
| CI | GitHub Actions — `prisma migrate deploy` antes do deploy |

Detalhes completos: [docs/adr/001-stack.md](docs/adr/001-stack.md).

---

## 5. Estrutura de pastas (alvo)

O repositório pode ainda não ter todo o scaffold. Ao criar ou estender código,
siga esta organização:

```
app/
  api/trpc/[trpc]/route.ts    # endpoint tRPC
  (login)/                    # rotas públicas
  (app)/                      # rotas autenticadas
src/
  server/
    api/
      routers/                # um router por domínio (equipamentos, emprestimos…)
      root.ts                 # AppRouter
      trpc.ts                 # createContext, procedures, middlewares
    services/                 # regras de negócio testáveis
    db.ts                     # singleton Prisma
  components/                 # UI reutilizável (shadcn + composições)
  lib/                        # utilitários, validação compartilhada
prisma/
  schema.prisma
  migrations/
  seed.ts                     # idempotente; cria tenant suporte_ti
```

**Rotas de interface** (de [layout.md](layout.md)):

| Rota | Tela |
|---|---|
| `/login` | Login |
| `/catalogo` | Catálogo |
| `/catalogo/:patrimonio` | Detalhe do item |
| `/meus-emprestimos` | Meus empréstimos |
| `/operacoes/emprestimos` | Empréstimos em aberto |
| `/operacoes/equipamentos/novo` | Cadastrar equipamento |

---

## 6. Padrões de código

### tRPC

- **Fonte da verdade:** o `AppRouter`; tipos inferidos com `RouterInputs` /
  `RouterOutputs` — nunca redeclarar tipos de resposta à mão.
- **Validação:** Zod em todo `.input()`; regra de negócio no service, não no
  procedimento além de permissão e orquestração.
- **Erros:** `TRPCError` com código padronizado; tratados pelo `errorFormatter`.
- **Paginação:** cursor via `useInfiniteQuery` — não usar offset.
- **Procedimentos de domínio:** sempre passar por middleware de tenant.

### Middlewares de autorização (encadeados)

| Middleware | Garante |
|---|---|
| `protectedProcedure` | Usuário autenticado |
| `tenantProcedure` | Membership no tenant; injeta `tenant_id` no contexto |
| `adminProcedure` | Papel de administrador no tenant |

Permissão e tenant vêm do **contexto do request** (`createContext`), nunca do
input do cliente.

### Services

- Contêm regras de negócio testáveis sem montar HTTP.
- Recebem `tenant_id` já resolvido pelo procedimento.
- Toda query/mutation de domínio filtra por `tenant_id`.
- Exemplos de regras: limite de 3 itens, bloqueio por atraso, status de
  equipamento.

### Prisma e banco

- **Dono do schema:** Prisma Migrate — único caminho de migration.
  Procedimento completo: [rules/migrations.md](rules/migrations.md).
- **RLS, policies, triggers:** SQL bruto dentro das migrations do Prisma.
- **RLS:** habilitado em todas as tabelas, deny by default; defesa em
  profundidade, **não** autorização primária (Prisma bypassa RLS por padrão).
- **Conexão runtime:** Supavisor, porta 6543, `?pgbouncer=true&connection_limit=1`.
- **Conexão migration:** `directUrl`, porta 5432.
- **Seed:** `prisma/seed.ts`, idempotente; primeiro tenant: `suporte_ti`.
- **Não** usar Supabase CLI como dono de schema.

### O que não fazer (arquitetura)

- Server Actions para mutação
- Server Components buscando dado direto no Prisma (dois caminhos de leitura)
- Cliente Supabase no browser para acesso a dados de domínio
- Bibliotecas fora do ADR-001 sem proposta e aprovação
- Mock do Prisma para testar constraint, transação, cascade ou RLS

---

## 7. Multi-tenancy

Modelo lógico: coluna `tenant_id` em toda tabela de domínio, banco único.

- Vínculo usuário–tenant: tabela `memberships (user_id, tenant_id, role)`.
- Tenant resolvido no `createContext` a partir da sessão.
- `tenantProcedure` injeta o filtro — não depender de cada service lembrar
  do `where: { tenantId }`.
- **Teste obrigatório:** para cada procedimento de domínio, um caso em que
  tenant A não enxerga dado de tenant B.

---

## 8. Autenticação

- Supabase Auth com e-mail e senha.
- Cadastro fechado (somente convite de administrador).
- Integração: `@supabase/ssr`.
- Sessão: cookie `httpOnly`, escrito pelo `@supabase/ssr`.
- Middleware do Next renova sessão em toda rota.

---

## 9. Interface (Nocturne)

Referência completa: [layout.md](layout.md).

Resumo para implementação:

- **Somente modo escuro.** Não existe modo claro nem alternador de tema.
- Primária `#001449` como fundo profundo; cor de ação visível `#5B7FE0`.
- Botões primários **contornados** (borda + fundo transparente), nunca sólidos.
- Fonte: Open Sans. Ícones: Phosphor (`@phosphor-icons/web`).
- Layout: sidebar fixa 236px + main; `flex`/`grid` + `gap` — sem margens
  individuais para espaçamento.
- Copy: português BR, seco e operacional; datas `dd/mmm` (ex.: `14/set`).
- Estados visíveis: Disponível, Emprestado, Manutenção, Atraso (cores em
  `layout.md` §2.4).
- Regras de negócio devem ser **visíveis na UI**: contador "2 de 3 itens",
  barra de prazo, bloqueio de solicitação por atraso, etc.

---

## 10. Testes

| Tipo | Quando | Como |
|---|---|---|
| Service | Regra de negócio | Vitest, Postgres via Testcontainers |
| Procedimento tRPC | Permissão, tenant, orquestração | `createCaller` com contexto montado |
| Componente | UI com interação relevante | Vitest + Testing Library |
| Isolamento de tenant | Todo procedimento de domínio | Tenant A vs tenant B |
| E2E | Fluxos que travam operação | Playwright (login, empréstimo, devolução, cadastro) |

Meta: caminhos críticos cobertos — não há meta de percentual de cobertura.
Não escrever teste que só valida o mock.

---

## 11. Variáveis de ambiente

Modelo em [.env.example](.env.example). Nunca versionar `.env`.
Procedimento completo: [rules/secrets.md](rules/secrets.md).

| Variável | Onde roda | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente | Público |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente | Público |
| `DATABASE_URL` | Servidor | Pooler 6543 |
| `DIRECT_URL` | Servidor (migrate) | Direto 5432 |
| `SUPABASE_SERVICE_ROLE_KEY` | Servidor | **Nunca** `NEXT_PUBLIC_` |
| `SENTRY_DSN` | Servidor | Quando Sentry estiver configurado |

Variáveis obrigatórias devem ser validadas com Zod no boot da aplicação.

---

## 12. Setup local (quando o scaffold existir)

1. Copiar `.env.example` → `.env` e preencher credenciais locais.
2. `npm install`
3. Subir Postgres local (Docker/Testcontainers ou instância de dev).
4. `npx prisma migrate dev` (ou `migrate reset` para estado limpo).
5. `npx prisma db seed`
6. `npm run dev`

**Não** alterar schema ou dados no Supabase remoto. Tudo de migration e seed
acontece no ambiente local.

Se `package.json` ou scripts ainda não existirem, diga o que falta configurar
em vez de assumir que o ambiente está pronto.

---

## 13. Validação antes de declarar pronto

Siga [rules/checks.md](rules/checks.md). Resumo:

1. `npm test`
2. `npx prisma migrate reset --force` (se tocou em schema/migration)
3. `npm run lint`
4. `npm run build`
5. `git status --short` (sem `.env` ou arquivos fora do escopo)
6. Informar qual item do PRD ou regra de negócio foi atendido

Pronto = comandos aplicáveis passaram **e** git status limpo no escopo.
Teste vermelho = tarefa não terminada, mesmo que o código "pare certo".

---

## 14. Git, PR e deploy

- Trabalhar em branch; abrir PR para merge.
- Não push direto na branch de produção.
- Não rodar deploy nem alterar configuração da Vercel.
- Não commitar `.env`, credenciais ou segredos.
- Só criar commit quando o usuário pedir explicitamente.
- Migrations em produção: `prisma migrate deploy` via GitHub Actions, antes
  do deploy (conforme ADR).

---

## 15. Objetivo e postura da IA

### Foco

- Implementar features alinhadas ao PRD
- Corrigir bugs e regressões
- Manter isolamento de tenant e segurança
- Escrever testes nos caminhos críticos
- Preservar a arquitetura do ADR

### Autonomia moderada

- Explicar brevemente o plano antes de editar
- Preferir mudanças pequenas e focadas; refatorar quando for a melhor solução
- Uma tarefa por vez; rodar checks antes de concluir
- Propor bibliotecas ou mudanças arquiteturais — não implementar sem alinhamento

### Limites rígidos

Ver [rules/restrictions.md](rules/restrictions.md). Os mais críticos:

- Não ignorar `tenant_id`
- Não expor segredos
- Não implementar fora do escopo v1
- Não contradizer ADR ou PRD
- Não tocar ambiente remoto (Supabase prod, Vercel prod)

---

## 16. Comunicação

- Plano breve antes de edições relevantes
- Justificar decisões quando a mudança for ampla
- Comunicar riscos (migration destrutiva, breaking change de API, etc.)
- Respostas curtas e práticas
- Ao concluir: o que mudou, o que foi testado, qual critério do PRD atende

---

## 17. Valores do projeto

Simplicidade arquitetural · segurança · isolamento de tenant · previsibilidade
· qualidade operacional · um repositório · um deploy.

A IA deve reforçar esses valores e nunca contradizer o PRD ou o ADR.
