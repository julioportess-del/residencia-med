# Residencia Med

Plataforma de estudo para residencia medica baseada em analise de bancas, repeticao espacada e IA.

## Visao em uma linha

Estudante define banca-alvo e horas/semana. Plataforma gera plano adaptativo, treina com questoes reais das ultimas 10 provas, explica erros com guidelines (SBP, SBC, MS), e revisa em intervalos calculados ate o dia da prova.

## Stack

| Camada | Tecnologia | Por que |
|---|---|---|
| Frontend web | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui | App Router para streaming UI; shadcn por composicao real, nao componente fechado |
| Mobile | Expo (React Native) + TypeScript | Compartilha types e logica com web via monorepo |
| API | Next.js Route Handlers + tRPC | Type-safety end-to-end sem REST boilerplate |
| Banco | Postgres (Neon) + Prisma + pgvector | Relacional + busca semantica em guidelines |
| Cache / fila | Upstash Redis + BullMQ | Jobs de analise de provas, geracao de questoes IA |
| Auth | Clerk | Multi-tenant nativo, B2C + B2B em uma SDK |
| Pagamento | Stripe (Checkout + Customer Portal) | Padrao de mercado para SaaS |
| IA | Anthropic Claude (primario) + OpenAI (fallback) | Claude para raciocinio clinico longo, OpenAI para embeddings |
| Observabilidade | Sentry + Axiom + PostHog | Erros, logs, produto |
| Hosting | Vercel (web) + Railway (workers) + Neon + Upstash | Tudo serverless / managed |

## Estrutura

```
residencia-med/
  apps/
    web/        Next.js 15 - app principal
    mobile/     Expo - cliente mobile
    workers/    BullMQ workers para analise e jobs IA
  packages/
    db/         Prisma schema + client
    ai/         Wrapper Claude/OpenAI + prompts
    core/       Logica de dominio (analise, SM-2, plano)
    ui/         Primitivas compartilhadas
    types/      Tipos compartilhados
    config/     ESLint, TS, Tailwind base
  docs/
    ARCHITECTURE.md
    DATA-MODEL.md
    ROADMAP.md
    adr/        Architecture Decision Records
```

## Setup local

```bash
pnpm install
cp .env.example .env.local
docker compose up -d   # Postgres + Redis local
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Web roda em `http://localhost:3000`.

## Roadmap

- [x] Turno 1 — Documento mestre + monorepo + schema (este turno)
- [ ] Turno 2 — MVP web: questoes, simulado, dashboard, plano
- [ ] Turno 3 — Camada de IA + repeticao espacada
- [ ] Turno 4 — SaaS completo (auth, billing, multi-tenant)
- [ ] Turno 5 — App mobile (Expo)

Detalhe completo em [docs/ROADMAP.md](docs/ROADMAP.md).

## Licenca

Proprietary — todos os direitos reservados.
