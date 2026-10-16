# Auditoria da plataforma — 16/10/2026

Escopo: código (monorepo `residencia-med`) + dados de produção (Supabase `iytnxfzxhatikodkmjuv`).
Objetivo do dono: **plataforma pessoal** (não SaaS) para aprovação em R1 de **Anestesiologia**.
Backup antes de qualquer mudança: `~/Documents/residencia-med-backup/2026-10-16/` (dados + `repo-all-branches.bundle` + patch das sessões paralelas).

## 1. Dados em produção

| Item                       | Quantidade             | Observação                                                                               |
| -------------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| Questões publicadas        | 1.442                  | 1.418 importadas de PDFs oficiais (AMRIGS 410, HCPA 835, ENARE 97, UFPR 76) + 24 do seed |
| Com gabarito oficial       | 1.418                  | Gabarito da banca; campo `fonte` guarda a URL do PDF                                     |
| Com comentário pedagógico  | ~0                     | Todas as importadas têm o texto "Explicação pendente…"                                   |
| Com tema/especialidade     | 24                     | **98% sem classificação** → filtros e estatísticas por área ficam vazios                 |
| Staging aguardando revisão | 769                    | `QuestaoStaging.status = PENDENTE_REVISAO`                                               |
| PDFs brutos                | 150                    | `PdfBruto`                                                                               |
| Guidelines                 | 5                      | Nenhuma de anestesiologia (SBA/ASA ausentes do enum `FonteGuideline`)                    |
| Usuários                   | 1 (dono, conta master) | Dados zerados em 15/10/2026                                                              |

Observações:

- O pipeline de importação (PDF → staging → questão) **não está neste repositório**. As tabelas `PdfBruto`, `QuestaoStaging`, `LogIngestao` e `FonteIngestao` existem só no banco. Precisa ser localizado ou reconstruído.
- A fonte do ENARE 2023 é um PDF hospedado pela Medway (S3), não pela banca. Vale trocar pela fonte oficial (FGV/HU Brasil).
- O formato da prova ACM/AMRIGS 2026 é **A–D (4 alternativas), 100 questões**. Questões antigas podem ter 5 alternativas, o que muda a taxa de acerto esperada no chute.

## 2. Funcionalidades (estado em 16/10/2026)

Legenda: ✅ existe · 🟡 parcial · ❌ não existe

| Área                      | Estado  | Resumo                                                                                                                                                 |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A. Dashboard              | ✅      | Bloco "Hoje" (contagem regressiva, meta semanal), prioridade por especialidade, proficiência. Conta repetições como novas respostas                    |
| B. Banco de questões      | 🟡      | Router aplica só 4 filtros (banca, dificuldade, ano, tema); a UI expõe 2; sem paginação nem busca                                                      |
| C. Filtros salvos/listas  | ❌      | —                                                                                                                                                      |
| D. Resolução              | 🟡      | Modo livre com cronômetro e confiança (3 níveis). Sem modos aleatório/sequencial/prova; sem retomar sessão                                             |
| E. Correção comentada     | 🟡→✅\* | \*Corrigida nesta etapa: gabarito + sua resposta + leitura de confiança + comentário por alternativa + temas + diretrizes + PDF original + IA rotulada |
| F. Simulados              | 🟡      | Duplicava respostas e falsificava tempo (corrigido nesta etapa); resultado não mostra quebra por área                                                  |
| G. Cronograma             | 🟡      | Gerado só pelo worker (não roda); mostra a semana errada após regeneração; não é adaptativo                                                            |
| H. Caderno de erros       | ❌      | —                                                                                                                                                      |
| I. Flashcards             | ❌      | Só exportação CSV para Anki                                                                                                                            |
| J. Estatísticas           | 🟡      | KPIs básicos; sem evolução temporal, por banca ou calibração de confiança                                                                              |
| K. Metas                  | 🟡      | Meta diária derivada das horas/semana; não editável                                                                                                    |
| L. Mobile/PWA             | 🟡      | **Sem navegação no celular**; ícones do PWA ausentes; app Expo separado                                                                                |
| M. Organização pedagógica | 🟡      | 7 especialidades, hierarquia de temas; **sem Anestesiologia**                                                                                          |
| N. IA                     | 🟡      | Explicação, mentor, gerar similar, classificar tema. **Sem chave Anthropic em produção**                                                               |
| O. Desempenho             | ✅      | Proficiência ponderada por dificuldade (só questões com tema)                                                                                          |
| P. Revisões               | 🟡→✅\* | SM-2. \*Antes dependia de Redis + worker (nunca rodavam); agora atualiza a cada resposta                                                               |
| Q. Busca                  | ❌      | Embeddings existem no schema, nada os usa                                                                                                              |
| R. Materiais              | ❌      | —                                                                                                                                                      |
| S. Navegação              | ✅      | Desktop ok; mobile ausente                                                                                                                             |
| T. Extras                 | —       | Confiança registrada em `Resposta`; notificações; experimentos A/B, B2B/Stripe (peso morto para uso pessoal)                                           |

## 3. Bugs críticos encontrados

| #   | Bug                                                                       | Impacto                                                                        | Status                                                 |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| 1   | Chave do cache de IA ignorava argumentos aninhados (`cache.ts`)           | Com Redis ligado, toda explicação/classificação devolveria a primeira do cache | **Corrigido** + teste                                  |
| 2   | Revisão espaçada só via fila Redis/worker                                 | Nenhum item de revisão era criado                                              | **Corrigido**: inline na resposta                      |
| 3   | `questao.detalhe` enviava gabarito e explicação antes da resposta         | Gabarito visível no DevTools                                                   | **Corrigido**                                          |
| 4   | Simulado reenviava respostas (voltar / tempo esgotado) e usava 60 s fixos | Estatísticas infladas, tempo falso                                             | **Corrigido**: envio único, tempo real, retomada local |
| 5   | `sessao.finalizar` e `responder` não checavam dono da sessão              | Escrita em sessão alheia                                                       | **Corrigido**                                          |
| 6   | Paywall FREE (100 questões/mês, 0 IA)                                     | Bloqueava o dono                                                               | Corrigido em 15/10 (conta master)                      |
| 7   | Cronograma mostra semana errada após regeneração                          | Plano incoerente                                                               | Pendente (Etapa 4)                                     |
| 8   | Sem navegação mobile + PWA sem ícones                                     | Inutilizável no celular                                                        | Pendente (Etapa 2)                                     |
| 9   | `LLMCall.cacheKey @unique`                                                | Logs de IA repetidos são descartados                                           | Pendente (baixo impacto)                               |
| 10  | Correção sem comentário (1.418 questões "pendentes")                      | Pouco aprendizado por questão                                                  | Depende de IA → decisão do dono                        |

## 4. Peso morto para uso pessoal

B2B (Organization, convites, API keys, REST `/api/v1`), Stripe/planos, experimentos A/B, simulado ao vivo em sala, contribuição comunitária, e o produto Escriba no mesmo monorepo. **Não remover agora** (risco sem ganho); apenas tirar da navegação quando atrapalhar.
