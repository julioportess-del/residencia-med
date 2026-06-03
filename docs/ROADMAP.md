# Roadmap

Plano de entrega em 5 turnos. Cada turno termina com codigo rodando, testado e merge-able.

---

## Turno 1 — Fundacao (este turno)

**Entregue:**

- Monorepo pnpm + Turborepo configurado
- Documentos: ARCHITECTURE, DATA-MODEL, ROADMAP, 5 ADRs
- Schema Prisma completo com 18 modelos e 11 enums
- Pacotes scaffolded: db, ai, core, ui, types, config
- Apps scaffolded: web (Next.js 15), workers (Node), mobile (Expo placeholder)
- docker-compose para Postgres + Redis local
- CI GitHub Actions: lint + typecheck + test em paralelo
- .env.example completo

**Criterio de pronto:**

- `pnpm install` funciona
- `pnpm build` passa em todos os pacotes
- `pnpm db:migrate` cria schema do zero
- Web abre tela placeholder em localhost:3000

---

## Turno 2 — MVP web

**Objetivo:** estudante consegue se cadastrar, escolher banca, responder questoes, ver dashboard.

**Entregas:**

1. Onboarding multi-step:
   - Banca alvo (selecao multi)
   - Data da prova
   - Carga horaria semanal
   - Auto-avaliacao por especialidade (1-5)
2. Banco de questoes:
   - Lista filtrada (banca, ano, tema, dificuldade)
   - Pagina de questao com resposta + correcao
   - Explicacao com guideline citado
3. Simulado:
   - Configuracao (banca, n. questoes, tempo)
   - Cronometro
   - Tela de resultado com analise
4. Dashboard:
   - Acertos/erros total
   - Por especialidade (grafico)
   - Por tema (top forcas e fraquezas)
   - Streak diario
5. Plano de estudo:
   - Visualizacao da semana atual
   - Bloco do dia em destaque
   - Marcar como concluido
6. Seed completo:
   - 8 bancas
   - 30 questoes reais (4-5 por banca prioritaria)
   - Especialidades + temas hierarquicos
   - 5 guidelines exemplo

**Tecnologia:**

- tRPC + TanStack Query
- shadcn/ui componentes (Button, Card, Dialog, Tabs, Form, Toast)
- React Hook Form + Zod
- Recharts para graficos
- next-safe-action para server actions

**Testes:**

- Vitest unit em packages/core (motor de analise, calculo de incidencia)
- Vitest integration em queries Prisma
- Playwright E2E: fluxo completo onboarding -> responder questao -> dashboard

**Criterio de pronto:**

- Usuario sem conta consegue ver landing, cadastrar (Clerk dev), completar onboarding, responder 10 questoes em simulado, ver dashboard
- 80%+ cobertura em packages/core
- Lighthouse: LCP <2.5s, INP <200ms na home

---

## Turno 3 — IA + repeticao espacada

**Objetivo:** plataforma vira inteligente. Erros recebem explicacao customizada; revisao acontece nos momentos certos.

**Entregas:**

1. packages/ai funcional:
   - `explicarErro(questao, alternativaErrada)` com Claude + prompt caching
   - `gerarQuestaoSimilar(questao, banca)` com structured output
   - `classificarTema(enunciado)` zero-shot
   - `buscarGuideline(query, k)` via pgvector
   - `gerarNarrativaPlano(plano)`
2. Cache em duas camadas:
   - Redis (24h, hash do input)
   - Postgres `LLMCall` table (permanente, custo trackeado)
3. Repeticao espacada (SM-2 modificado):
   - Calculo on `Resposta` create (worker)
   - Tela "Revisao do dia" com itens vencidos
   - Auto-incluir em sessoes de estudo livre
4. Worker analise de incidencia:
   - Recompute apos import de prova
   - Cron diario (idempotente)
   - Output em `AnaliseIncidencia`
5. Plano de estudo regenerador:
   - Trigger semanal (cron)
   - Trigger apos 50 respostas novas
   - Usa AnaliseIncidencia + desempenho do usuario
6. Tela "Por que errei?" expandida:
   - Resposta inicial com explicacao do banco
   - Botao "Explicar mais com IA" -> stream Claude

**Testes:**

- Mock de LLM em testes unit
- Integration test com cassette (replay de chamadas reais)
- Verificacao de cache hit ratio em staging

**Criterio de pronto:**

- Cache hit ratio >70% apos primeira semana
- Custo IA por usuario ativo <$0.50/mes (free tier limites)
- Latencia p95 de explicacao streaming: primeiro token <800ms
- Plano regenerado refletindo novos dados de respostas

---

## Turno 4 — SaaS completo

**Objetivo:** monetizar. Tres planos B2C + tier B2B.

**Entregas:**

1. Auth completa via Clerk:
   - Sign up / sign in
   - Login social (Google)
   - Reset de senha
   - Sessoes
2. Tres planos B2C:
   - FREE: 100 questoes/mes, sem IA
   - PRO ($19/mes): ilimitado, 50 explicacoes IA/mes
   - PREMIUM ($39/mes): tudo ilimitado + geracao de questoes
3. Tier B2B (Organization):
   - Plan STARTER ($99/mes ate 10 seats)
   - GROWTH ($299/mes ate 50 seats)
   - ENTERPRISE (custom)
   - Admin dashboard agregado
4. Stripe Checkout + Customer Portal:
   - Subscribe, upgrade, downgrade, cancel
   - Webhooks idempotentes
   - Pro-rata em mudanca de plano
5. Limites e enforcement:
   - Rate limit por plano
   - Soft limits com upsell prompt
   - Email transacional (Resend) em mudanca de plano
6. Painel admin:
   - Lista de usuarios, MRR, churn
   - Force-grant plano (para suporte)
   - Visualizar feedback

**Testes:**

- Webhook fixtures Stripe
- Test de cada transicao de plano
- Tenant isolation (usuario A nao ve dado de B)

**Criterio de pronto:**

- Usuario consegue assinar, pagar, ser cancelado, retomar
- Multi-tenant verificado por test
- Compliance LGPD: usuario pode deletar conta + dados

---

## Turno 5 — Mobile

**Objetivo:** mesmo produto na palma da mao, com sync.

**Entregas:**

1. Expo (React Native) + EAS:
   - iOS + Android
   - Auth via Clerk (mesmo backend)
   - Compartilha tipos com web via packages/types
2. Telas core:
   - Home / streak
   - Questoes (swipe entre questoes em sessao)
   - Simulado
   - Revisao do dia
   - Dashboard
3. Sync:
   - Respostas offline -> queue local -> sync ao voltar online
   - Conflito: server-wins (timestamps)
4. Push notifications:
   - Lembrete diario configuravel
   - Items de revisao vencendo
   - Novo simulado disponivel
5. Performance:
   - Lazy load de imagens de questoes
   - Lista virtualizada (FlashList)
   - Animacoes em RN Reanimated

**Testes:**

- Detox E2E em iOS e Android
- Snapshot de telas principais

**Criterio de pronto:**

- App publicado em TestFlight + Play Console internal
- Crash-free rate >99%
- 80%+ feature parity com web (excluindo admin)

---

## Pos-roadmap (backlog priorizado)

1. **Mentor virtual conversacional** — chat com Claude que ja sabe historico do estudante
2. **Comparacao com aprovados** — anonimo, mostra distribuicao de desempenho
3. **Importacao colaborativa de questoes** — usuarios PRO contribuem provas, sistema valida
4. **Live simulados** — competicao em tempo real com leaderboard
5. **Integracao com Anki** — exportar items para quem ja tem fluxo Anki
6. **API publica B2B** — cursinhos integrarem com seus sistemas internos
7. **Modo cego** — apenas audio (caso clinico narrado) para estudo no transito
