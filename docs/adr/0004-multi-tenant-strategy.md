# ADR 0004 — Multi-tenancy: shared DB com tenant guard na aplicacao

**Status:** Aceito
**Data:** 2026-05-05

## Contexto

Dois publicos:

- **B2C**: estudante individual (~95% dos usuarios projetados)
- **B2B**: cursinhos/escolas com 5-500 estudantes (~5% dos usuarios, ~30% da receita projetada)

Como isolar dados?

## Opcoes

1. **DB por tenant**: schema/banco separado por organizacao
2. **Schema-per-tenant**: mesmo banco, schemas separados (Postgres schema)
3. **Shared DB com row-level**: uma tabela, coluna `tenantId` ou `userId`, filtro na aplicacao
4. **Shared DB com Postgres RLS**: mesma estrutura mas isolamento garantido pelo banco

## Decisao

**Opcao 3: shared DB com row-level filtragem na aplicacao**, via middleware Prisma.

Para B2C: cada usuario tem seus dados isolados por `userId`.
Para B2B: usuarios pertencem a `Organization`; queries de admin filtram por `organizationId`.

## Racional

- **Simplicidade operacional**: um banco, um schema. Migracoes simples.
- **Cost-per-tenant baixo**: Neon serverless cobra por uso, nao por banco
- **Escalabilidade**: 100k usuarios cabem confortavelmente num Postgres; sharding nao e preocupacao no horizonte de 2 anos
- **Cross-tenant analytics simples**: AnaliseIncidencia agrega entre todos os usuarios sem dor

## Implementacao

### Middleware Prisma de tenant guard

```typescript
prisma.$use(async (params, next) => {
  const ctx = getTenantContext() // AsyncLocalStorage
  if (!ctx) return next(params)

  const userScopedModels = ['Resposta', 'Sessao', 'PlanoEstudo', 'BlocoEstudo', 'ItemRevisao']
  if (userScopedModels.includes(params.model)) {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = { ...params.args.where, userId: ctx.userId }
    }
    if (params.action === 'create' || params.action === 'createMany') {
      // garantir userId na payload, falhar se ausente em dev
    }
  }
  return next(params)
})
```

### Org admin queries

Quando admin de Organization consulta dados agregados, query e:

```typescript
prisma.resposta.groupBy({
  by: ['questaoId'],
  where: { user: { organizationId: ctx.organizationId } },
  _count: true,
})
```

Bypass do middleware via marker explicito (`{ tenant: 'org' }` em params context).

### Testes

- Test obrigatorio: usuario A nao consegue ler dados de usuario B mesmo passando ID dele
- Test obrigatorio: admin org A nao ve dados de org B
- Test obrigatorio: tentativa de criar `Resposta` sem `userId` falha

## Por que nao RLS?

- Postgres RLS e poderoso mas:
  - Debug dificil (policy errors sao opacos)
  - Cada request precisa setar `SET LOCAL` — overhead com Prisma
  - Migracoes de policy versionadas separadamente — complica rollback
- Fica como upgrade futuro se virar requisito de compliance

## Por que nao DB-per-tenant?

- Para B2C nao faz sentido (custo + complicacao)
- Para B2B grande poderia, mas no nosso volume nao justifica
- Migracao seria refactor cirurgico mas viavel se grande cliente exigir

## Riscos

- **Bug de query sem filtro = vazamento**: mitigacao = middleware obrigatorio + lint rule custom + integration test
- **Performance em queries cross-tenant**: indices em `userId` e `organizationId` em todas as tabelas relevantes
- **Compliance LGPD**: delecao de usuario precisa cascade — implementado em schema com `onDelete: Cascade`

## Re-avaliar quando

- Cliente B2B exigir isolamento fisico (compliance hospitalar)
- DB > 500GB
- Volume de queries > 10k qps sustentado
