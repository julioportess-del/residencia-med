# CLAUDE.md

Contexto operacional para sessoes do Claude Code neste projeto.

## Sobre o produto

Plataforma de estudo para residencia medica. Usuario define banca-alvo e tempo disponivel; recebe plano adaptativo, treina com questoes reais analisadas, revisa por repeticao espacada, e tem cada erro explicado com base em guideline.

Bancas prioritarias: AMRIGS, ENARE, PSU-MG, IPSEMG, USP, SUS-SP, SES-SC, BH. Secundarias: UNIFESP, UNICAMP, UFRJ, HCPA, UFPR, FMRP-USP.

## Comandos essenciais

```bash
pnpm dev                    # roda web + workers
pnpm build                  # build de tudo
pnpm test                   # vitest em todos os pacotes
pnpm lint                   # eslint + tsc --noEmit
pnpm db:migrate             # prisma migrate dev
pnpm db:seed                # popula bancas, especialidades, 30 questoes
pnpm db:studio              # prisma studio
pnpm --filter web dev       # so o web
pnpm --filter workers dev   # so workers
```

## Convencoes nao obvias

- **Lingua**: codigo, comentarios, nomes de tabelas e dominio em portugues. Termos tecnicos (User, Session, etc.) podem ficar em ingles quando for vocabulario de framework. Mensagens de UI sempre em portugues brasileiro.
- **Schema Prisma**: enums em PORTUGUES_MAIUSCULO (ex: `Dificuldade { FACIL MEDIO DIFICIL }`).
- **Testes**: Vitest em todos os pacotes. Pasta `__tests__` co-localizada. Cobertura minima 80% em `packages/core` e `packages/ai`.
- **IA**: nunca chamar Claude/OpenAI direto de codigo de produto. Sempre via `packages/ai`. Toda chamada deve passar por cache (hash do input).
- **Multi-tenant**: toda query de dados de usuario filtra por `userId`. Para org admins, query filtra por `userId IN (SELECT id FROM users WHERE organizationId = ...)`.
- **Migrations**: nunca editar migration ja aplicada em prod. Sempre criar nova.

## Modelo de dados — pontos sensiveis

Ver [docs/DATA-MODEL.md](docs/DATA-MODEL.md) para racional completo.

- `Questao.hash` (sha256 do enunciado normalizado) e UNIQUE — previne duplicatas durante import
- `Questao.embedding` (pgvector 1536) usado para busca semantica e questoes similares
- `ItemRevisao` implementa SM-2 modificado com tracking de confianca
- `AnaliseIncidencia` e PRE-COMPUTADA — nunca calcular em request path

## Ao adicionar feature nova

1. ADR em `docs/adr/` se decisao arquitetural significativa
2. Schema Prisma primeiro se envolve dado novo
3. Logica em `packages/core` — apps so chamam, nao implementam
4. Tipos compartilhados em `packages/types`
5. Teste antes de UI
6. Storybook para componente novo de `packages/ui`

## Anti-padroes

- Logica de dominio dentro de Route Handler ou page.tsx — extrair pra `packages/core`
- Chamada direta a `prisma` em componente cliente — usar Server Action ou tRPC
- Prompt de IA hard-coded em multiple lugares — centralizar em `packages/ai/prompts`
- Usar `any` ou `as` para silenciar TS — refatorar tipos
- Dados de usuario sem filtro de tenant — sempre `where: { userId }`
