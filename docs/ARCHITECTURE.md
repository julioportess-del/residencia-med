# Arquitetura

Documento mestre de arquitetura. Tras decisoes principais com racional, fluxos criticos, e contornos do sistema. Decisoes pontuais ficam em `adr/`.

---

## 1. Visao em camadas

```
+------------------------------------------------------------+
|                      Cliente                               |
|   Next.js Web (apps/web)        Expo Mobile (apps/mobile)  |
+------------------------------------------------------------+
                       | tRPC over HTTPS
                       v
+------------------------------------------------------------+
|              API (Next.js Route Handlers + tRPC)           |
|      Auth (Clerk) | Rate limit | Tenant guard              |
+------------------------------------------------------------+
       |                |                  |
       v                v                  v
+-------------+  +--------------+  +-------------------+
|  Postgres   |  |  Redis cache |  |  BullMQ filas     |
|  + pgvector |  |  + sessions  |  |  (workers)        |
|  (Neon)     |  |  (Upstash)   |  |  (Railway)        |
+-------------+  +--------------+  +-------------------+
                                          |
                                          v
                                 +-------------------+
                                 |  Anthropic Claude |
                                 |  OpenAI (embed)   |
                                 |  Stripe webhooks  |
                                 +-------------------+
```

Quatro processos separados: web (SSR/edge), workers (Node container), banco, fila. Sem servidor monolitico — cada peca escala sozinha.

---

## 2. Principios

1. **Type-safety end-to-end.** Schema Prisma -> tipos gerados -> tRPC -> client. Quebra de contrato e erro de build, nao runtime.
2. **Logica de dominio fora dos apps.** `packages/core` concentra calculo de incidencia, SM-2, gerador de plano. Web e mobile so consomem.
3. **IA atras de uma fronteira.** Apenas `packages/ai` fala com LLM. Tudo cacheado por hash de input. Trocar provider e mudanca local.
4. **Pre-computar o caro.** Analise de incidencia, embeddings de questoes, ranking de temas — tudo em worker, escrito em tabela, lido em milissegundos.
5. **Erro do usuario e dado de produto.** Cada `Resposta` registra tempo, confianca e contexto. E o que alimenta o plano adaptativo.
6. **Tenant safety por padrao.** Toda query passa por middleware Prisma que injeta `userId` da sessao. Sem isso, query falha em dev.

---

## 3. Stack — racional

### Next.js 15 + App Router

- Server Components reduzem JS no cliente para telas pesadas (banco de questoes, dashboard)
- Streaming UI para simulado (renderiza enunciado antes de carregar alternativas se preciso)
- Edge runtime para rotas de leitura publica (questoes de demo)

### Prisma + Postgres + pgvector

- Prisma type-gen e o que justifica TS no monorepo
- pgvector evita Pinecone/Weaviate separado — busca semantica de guideline mora no mesmo banco
- Neon: branching de banco por PR de feature, serverless

### tRPC, nao REST

- Refatorar query no servidor renomeia o tipo no cliente automaticamente
- Sem OpenAPI / Zod manual em duas pontas
- REST so para webhook (Stripe, Clerk)

### Clerk em vez de Auth.js

- Multi-tenant nativo (Organizations)
- B2B: convidar membros, papeis (admin, member), audit log — tudo pronto
- Custo justifica: cada hora gasta em auth e hora nao gasta em produto medico

### Stripe Checkout (nao Elements custom)

- MVP de billing em horas, nao semanas
- Cliente final espera UX da Stripe, nao branding nosso

### Claude como LLM primario

- Raciocinio clinico longo (caso clinico + 5 alternativas + guideline) e ponto forte do Claude
- Prompt caching reduz custo de explicacao em ~80% (mesmo guideline reusado em N questoes)
- Fallback OpenAI so para embeddings (text-embedding-3-small mais barato)
- Detalhe em [adr/0003-claude-as-primary-llm.md](adr/0003-claude-as-primary-llm.md)

---

## 4. Modelo de dados

Ver [DATA-MODEL.md](DATA-MODEL.md) para schema completo, racional de cada tabela e indices.

**Tres clusters principais:**

1. **Conteudo**: `Banca`, `Prova`, `Questao`, `Alternativa`, `Tema`, `Especialidade`, `Guideline` — imutavel, populado por import.
2. **Atividade do usuario**: `Resposta`, `Sessao`, `ItemRevisao`, `BlocoEstudo` — mutavel, alta cardinalidade.
3. **Computado**: `AnaliseIncidencia`, `embedding` — derivado, regenerado por job.

---

## 5. Fluxos criticos

### 5.1 Estudante responde uma questao

```
Cliente -> tRPC questao.responder(questaoId, alternativaId, tempoSegundos, confianca)
  -> server action valida tenant
  -> Prisma cria Resposta
  -> dispara job 'atualizar-revisao' (BullMQ)
  -> retorna { correta, gabarito, explicacaoMd, alternativasErroExplicacao }
worker:
  -> busca/cria ItemRevisao(userId, questaoId)
  -> aplica SM-2: calcula novo intervalo, fatorFacilidade, proximaRevisao
  -> persiste
```

Resposta volta em <100ms (sem LLM no caminho). Explicacao ja vem pre-computada do banco.

### 5.2 Geracao do plano de estudo

```
onboarding salva: bancaAlvo, dataProva, cargaHorariaSemanal
  -> dispara job 'gerar-plano'
worker:
  1. carrega AnaliseIncidencia(bancaAlvo, ultimos 10 anos)
  2. ranqueia temas por (incidencia * tendencia * peso_dificuldade)
  3. distribui blocos pela carga horaria ate dataProva:
     - 60% questoes nos temas top
     - 25% revisao (puxa de ItemRevisao com proximaRevisao no periodo)
     - 10% simulado (semanal)
     - 5% teoria (so quando desempenho < 50% no tema)
  4. cria BlocoEstudo[] e PlanoEstudo
  5. opcionalmente chama Claude para gerar narrativa do plano
```

Plano regenerado semanalmente pelo cron, mais a cada 50 respostas novas.

### 5.3 Explicacao de erro (lazy)

```
Resposta retorna explicacaoMd ja pronta (do import)
SE explicacaoMd vazia OU usuario clica "explicar mais":
  -> tRPC questao.explicarComIA(questaoId, alternativaEscolhida)
  -> packages/ai cache check (hash = questaoId + alternativa)
  -> se miss: Claude com prompt caching:
      [system: clinico residente]
      [cache: enunciado completo + alternativas + gabarito]
      [user: por que '{alternativa}' esta errada vs '{gabarito}'?]
  -> persistir resultado, retornar
```

Cache hit ratio esperado >90% apos 1k respostas (questoes sao reutilizadas).

### 5.4 Import de prova

```
Admin upload PDF/JSON da prova ->
  -> worker 'importar-prova':
     1. parse PDF (unstructured.io ou pdfplumber)
     2. para cada questao:
        - normaliza enunciado, hash
        - se hash existe: skip
        - cria Questao + Alternativas
        - tagging de tema: classificador zero-shot (Claude com lista fechada)
        - busca guideline relacionado (semantic search no embedding)
        - gera embedding (OpenAI)
     3. recomputa AnaliseIncidencia para essa banca
```

---

## 6. Camada de IA

`packages/ai` exporta funcoes puras com cache embutido:

```typescript
explicarErro(questao, alternativaErrada): Promise<string>
gerarQuestaoSimilar(questao, banca): Promise<QuestaoGerada>
classificarTema(enunciado): Promise<TemaId[]>
buscarGuideline(query, k): Promise<Guideline[]>  // pgvector
gerarNarrativaPlano(plano): Promise<string>
```

**Cache**: chave = `sha256(funcao + args canonicalizados + modelo + versao_prompt)`. Valor em Redis (24h) + Postgres (permanente para itens caros).

**Prompt versioning**: cada prompt tem ID e versao. Mudou prompt = invalida cache. Permite A/B test entre versoes.

**Custo**: orcamento mensal por usuario rastreado em `User.creditosUsadosMes`. Free tier: 50 explicacoes/mes; Pro: ilimitado com soft limit.

Detalhe em [adr/0003-claude-as-primary-llm.md](adr/0003-claude-as-primary-llm.md).

---

## 7. Multi-tenancy

Dois tipos de usuario:

- **B2C**: estudante individual, `organizationId = null`. Maioria dos usuarios.
- **B2B**: cursinho/escola, `organizationId != null`. Admins veem dashboard agregado dos membros.

**Isolamento**: middleware Prisma injeta filtro `userId = ctx.userId` em queries de dados pessoais (`Resposta`, `Sessao`, `PlanoEstudo`, `ItemRevisao`). Conteudo (`Questao`, `Banca`, etc.) e global.

**Admin org query**:
```ts
where: { user: { organizationId: ctx.organizationId } }
```

Detalhe em [adr/0004-multi-tenant-strategy.md](adr/0004-multi-tenant-strategy.md).

---

## 8. Observabilidade

| Sinal | Ferramenta | Uso |
|---|---|---|
| Erros app | Sentry | Stack trace, breadcrumbs, source maps |
| Logs estruturados | Axiom | Pino -> Axiom, busca SQL |
| Metricas produto | PostHog | Funil onboarding, retencao, feature usage |
| Custo IA | Tabela `LLMCall` | Cada chamada registra tokens, custo, latencia |
| Performance DB | Prisma metrics + pg_stat_statements | Queries lentas |
| Health checks | `/api/health` por app | Vercel + uptime monitor |

**SLOs minimos:**
- p95 latencia tRPC: 250ms
- Disponibilidade: 99.5%
- Tempo de resposta de questao (sem IA): 100ms p95

---

## 9. Seguranca e LGPD

- **PII**: email + nome em `User`. Sem dados sensiveis de saude do usuario (so historico de estudo).
- **Direito ao esquecimento**: Stripe customer + Clerk + cascade delete em `User`. Job dedicado `lgpd-deletar-usuario`.
- **Rate limit**: Upstash Ratelimit por IP + por user. Default 60req/min em rotas autenticadas, 10/min em endpoints de IA.
- **Secrets**: nunca em git. Vercel/Railway env vars + 1Password para time.
- **CSP**: `default-src 'self'`, nonce-based para scripts. Configurado em `apps/web/middleware.ts`.
- **Autenticacao**: JWT do Clerk validado em cada request. Refresh transparente.
- **Idempotencia**: webhooks Stripe e Clerk validam assinatura + idempotency key.

---

## 10. Performance

**Web:**
- Bundle budget: 150kb JS gzip na landing, 300kb em apps autenticados
- Imagens: next/image com AVIF/WebP, dimensoes explicitas
- Fonts: Inter via next/font, swap, preload weight 400 e 600 so
- LCP < 2.5s, INP < 200ms, CLS < 0.1

**API:**
- Connection pool Postgres via Prisma Data Proxy (Neon faz pool nativo)
- Redis cache em queries de leitura quente: lista de bancas, especialidades, top temas
- TanStack Query no cliente com staleTime de 5min para dados pouco mutaveis

**Worker:**
- Concurrency configuravel por tipo de job
- Batch de jobs de embedding (OpenAI permite 100 textos/req)
- Backoff exponencial em falha

---

## 11. Deployment

**Ambientes:**
- `dev`: local docker-compose
- `preview`: cada PR vira deploy Vercel + branch Neon
- `staging`: branch `main` -> staging.residencia-med.com
- `production`: tag `release-*` -> residencia-med.com

**Pipeline (GitHub Actions):**
1. Lint + typecheck (todos os pacotes em paralelo via Turborepo)
2. Test (Vitest)
3. Build
4. E2E (Playwright contra preview deploy)
5. Migrate (`prisma migrate deploy` em staging/prod)
6. Deploy

Workers: Railway com auto-deploy do branch `main`. Migracoes rodam antes do deploy via release command.

---

## 12. Decisoes adiadas

Coisas que conscientemente NAO estao no MVP:

- **Comunidade / forum**: classico time sink. Talvez v2.
- **Flashcards manuais (Anki-style)**: ItemRevisao ja faz isso em cima de questoes. Reavaliar.
- **Mentoria humana (revisao de duvida por medico real)**: depende de operacao, nao codigo.
- **Gamificacao pesada (XP, ranking publico)**: dados ainda nao validam. Comecar com streak simples.
- **App offline first completo**: mobile sincroniza, mas requer conexao. Offline puro e v2.
- **GraphQL**: tRPC resolve. Adicionar so se cliente externo precisar (B2B API).

---

## 13. Referencias

- [DATA-MODEL.md](DATA-MODEL.md) — schema detalhado
- [ROADMAP.md](ROADMAP.md) — entregas por turno
- [adr/](adr/) — decisoes pontuais com contexto
