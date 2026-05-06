# ADR 0002 — Stack: Next.js 15 + Prisma + Postgres + tRPC

**Status:** Aceito
**Data:** 2026-05-05

## Contexto

Precisamos:
- App web rapido (LCP <2.5s)
- API type-safe (web + mobile consumindo mesmos endpoints)
- Banco relacional (questoes tem estrutura clara) com busca semantica em guidelines
- Deploy serverless (sem ops dedicado)

## Decisao

- **Web**: Next.js 15 (App Router)
- **API**: Route Handlers + tRPC v11
- **ORM**: Prisma 5
- **DB**: Postgres 16 + pgvector (Neon serverless)
- **Cache/fila**: Upstash Redis + BullMQ (workers no Railway)

## Consequencias

**Positivas:**
- Server Components reduzem JS no cliente (banco de questoes carrega <100KB)
- Streaming UI para listas longas e geracao IA
- tRPC: refatorar query renomeia tipo no client autom
- Prisma + pgvector no mesmo banco evita Pinecone separado ($70/mes economizados, latencia menor)
- Neon branching: cada PR tem banco isolado pra E2E
- Vercel + Neon + Upstash: tres dashboards, zero servidor pra cuidar

**Negativas:**
- Next.js cold start em rotas raras (Vercel mitiga com edge cache)
- App Router ainda tem casos extremos (parallel routes, intercepted routes) — evitar quando possivel
- pgvector nao e tao rapido quanto Pinecone para >10M vetores; suficiente pra nosso caso (~100k guidelines + questoes)
- Prisma 5 ainda tem overhead de runtime (~5-10ms). Aceitavel; se virar gargalo, migrar queries criticas para Kysely.

## Alternativas consideradas

| Stack | Por que nao |
|---|---|
| Remix + Drizzle | tRPC + Prisma melhor type-gen pra equipe pequena; Remix bom mas ecossistema menor |
| SvelteKit | Curva de aprendizado nao justifica em time pequeno |
| FastAPI + React | Duas linguagens, dois deploys, dois sistemas de tipos. Desnecessario |
| Supabase | Otimo BaaS mas RLS complexo de testar; queremos ORM tipado |
| MongoDB | Questoes/temas/guidelines sao relacionais natos. ORM tipado em Mongo e dor |

## Pontos de re-avaliar

- Se DB > 100GB de embeddings: considerar Pinecone/Weaviate
- Se time crescer >5 devs: considerar split de monorepo ou Nx
- Se Vercel ficar caro (>$1k/mes): Railway/Fly para web

## Referencia

- https://nextjs.org/docs/app
- https://trpc.io/docs/v11
- https://www.prisma.io/docs
- https://github.com/pgvector/pgvector
