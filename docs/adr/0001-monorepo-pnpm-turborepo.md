# ADR 0001 — Monorepo com pnpm workspaces + Turborepo

**Status:** Aceito
**Data:** 2026-05-05

## Contexto

Vamos entregar web (Next.js), mobile (Expo), workers (Node) e pacotes compartilhados (db, ai, core, ui, types). Tres opcoes:

1. **Polyrepo**: cada app/pacote em repo separado
2. **Monorepo simples** (pnpm workspaces puro)
3. **Monorepo com cache de build** (pnpm + Turborepo)

## Decisao

Monorepo com pnpm workspaces + Turborepo.

## Consequencias

**Positivas:**

- Type safety end-to-end: mudanca em `packages/db/prisma/schema.prisma` quebra build do `web` instantaneamente
- Refactor cross-cutting em uma PR
- Turborepo cacheia build/test/lint — CI volta de ~6min para <2min com cache quente
- pnpm symlinks evitam duplicacao de node_modules (~70% menos disco)
- Compartilhar tsconfig, eslint, tailwind base via `packages/config`

**Negativas:**

- Curva de aprendizado pra quem nao viu monorepo
- IDE precisa de setup (VS Code workspace settings)
- Docker build de um app especifico requer `--filter` corretos

**Mitigacoes:**

- Documentar comandos comuns em CLAUDE.md
- `.vscode/` commitado com extensions e settings recomendados
- Dockerfile usa `pnpm deploy` para extrair so o necessario

## Alternativas consideradas

- **Nx**: poderoso mas overhead de aprendizado nao justifica neste tamanho
- **Lerna**: deprecated effetivo, sem cache
- **Bazel**: industrial, mata mosca com canhao

## Referencia

- https://turbo.build/repo/docs
- https://pnpm.io/workspaces
