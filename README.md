# Residência Med

> 🟢 **No ar:** https://residencia-med.vercel.app (modo demo — completar setup em [docs/DEPLOY.md](docs/DEPLOY.md))

Plataforma de estudo para residência médica baseada em análise de bancas, repetição espaçada e IA.

## Visão em uma linha

O estudante define a banca-alvo e o tempo disponível. A plataforma gera um plano adaptativo, treina com questões reais das últimas 10 provas, explica cada erro com guidelines (SBP, SBC, MS) e revisa em intervalos calculados até o dia da prova.

## Stack

| Camada | Tecnologia | Por que |
|---|---|---|
| Frontend web | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui | App Router para streaming de UI; shadcn por composição real, não componente fechado |
| Mobile | Expo (React Native) + TypeScript | Compartilha tipos e lógica com a web via monorepo |
| API | Next.js Route Handlers + tRPC | Type-safety end-to-end sem boilerplate REST |
| Banco | Postgres (Neon) + Prisma + pgvector | Relacional + busca semântica nas guidelines |
| Cache / fila | Upstash Redis + BullMQ | Jobs de análise de provas e geração de questões com IA |
| Auth | Supabase Auth | Email/senha + OAuth (Google), JWT pra mobile, sem vendor lock-in |
| Pagamento | Stripe (Checkout + Customer Portal) | Padrão de mercado para SaaS |
| IA | Anthropic Claude (primário) + OpenAI (fallback) | Claude para raciocínio clínico longo; OpenAI para embeddings |
| Observabilidade | Sentry + Axiom + PostHog | Erros, logs e métricas de produto |
| Hosting | Vercel (web) + Railway (workers) + Neon + Upstash | Tudo serverless ou totalmente gerenciado |

## Estrutura

```
residencia-med/
  apps/
    web/        Next.js 15 — aplicação principal
    mobile/     Expo — cliente mobile
    workers/    Workers BullMQ para análise e jobs de IA
  packages/
    db/         Schema Prisma + client
    ai/         Wrapper Claude/OpenAI + prompts
    core/       Lógica de domínio (análise, SM-2, plano)
    billing/    Planos, Stripe, limites, webhook
    ui/         Primitivas compartilhadas
    types/      Tipos compartilhados
    config/     ESLint, TS e Tailwind base
  docs/
    ARCHITECTURE.md
    DATA-MODEL.md
    ROADMAP.md
    DEPLOY.md
    adr/        Architecture Decision Records
```

## Setup local — caminho rápido

Pré-requisito: `pnpm` e Homebrew.

```bash
# 1. Instalar Colima + Docker CLI (uma vez)
brew install colima docker docker-compose

# 2. Instalar deps + subir tudo
pnpm install
./scripts/dev-up.sh
```

`./scripts/dev-up.sh` faz tudo: inicia Colima, sobe Postgres + Redis,
aplica migrations e roda o Next.js dev server. Depois:

- Abrir http://localhost:3000
- Você já está logado como `dev@residencia-med.local` (modo dev — definido por
  `DEV_USER_EMAIL` no `.env`). Para autenticação real, configure
  `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` e remova `DEV_USER_EMAIL`.

Outros scripts:
- `./scripts/dev-seed.sh` — repopula bancas, temas, guidelines e questões
- `./scripts/dev-down.sh` — para os containers (mantém os dados)

## Setup local — manual

```bash
pnpm install
cp .env.example .env
docker-compose up -d
pnpm --filter @residencia-med/db exec prisma migrate deploy
pnpm --filter @residencia-med/db db:seed
pnpm --filter @residencia-med/web dev
```

A web sobe em `http://localhost:3000`.

## Roadmap

- [x] Turno 1 — Documento mestre, monorepo e schema
- [x] Turno 2 — MVP web: questões, simulado, dashboard, plano
- [x] Turno 3 — Camada de IA com streaming + repetição espaçada SM-2
- [x] Turno 4 — SaaS completo (Clerk + Stripe + multi-tenant)
- [x] Turno 5 — App mobile (Expo)

Detalhe completo em [docs/ROADMAP.md](docs/ROADMAP.md).

## Licença

Proprietary — todos os direitos reservados.
