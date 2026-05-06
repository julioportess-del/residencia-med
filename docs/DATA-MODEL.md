# Modelo de Dados

Racional do schema Prisma. Para o codigo canonico, ver [packages/db/prisma/schema.prisma](../packages/db/prisma/schema.prisma).

---

## Conceitos centrais

### Banca, Prova, Questao

- `Banca` e a instituicao examinadora (AMRIGS, ENARE, USP).
- `Prova` e a edicao especifica de uma banca em um ano e tipo (R1 / R3 / Acesso Direto).
- `Questao` pertence a uma `Prova` e uma `Banca` (denormalizado para query rapida sem join).

Por que questao tem `bancaId` direto, alem do `provaId`?
> Porque consulta tipica e "todas as questoes da AMRIGS sobre cardiologia" — evita join em `Prova`. Trade-off aceito: invariante mantido por trigger (ou pela aplicacao no import).

### Tema hierarquico

`Tema` tem `parentId` opcional. Ex: Cardiologia > Arritmias > Fibrilacao Atrial.

Decisao: profundidade pratica = 3. Mais que isso vira ruido na UI e na analise.

### QuestaoTema (n-para-n com peso)

Uma questao pode tocar varios temas (caso clinico que cobra ECG + farmaco). `peso` permite distinguir tema principal (1.0) de secundarios (0.3-0.5). Analise de incidencia usa peso.

### Guideline

Fonte de verdade clinica: SBP, SBC, Ministerio da Saude, NICE, UpToDate. Cada guideline tem `embedding` para busca semantica. `QuestaoGuideline` liga questao -> guideline com `trecho` (citacao especifica usada na explicacao).

---

## Atividade do usuario

### Resposta

Granularidade: uma linha por tentativa. Mantem historico completo, nao sobrescreve.

Campos chave:
- `correta`: bool (denormalizado de `alternativa.correta`, mantido por aplicacao)
- `tempoSegundos`: usado para detectar "chute" (resposta < 10s costuma ser ruim)
- `confianca`: enum auto-reportada — alimenta SM-2 modificado
- `modoRevisao`: separa primeira tentativa de revisao espacada

Indices criticos:
- `(userId, createdAt)` — feed de atividade
- `(questaoId)` — quantas pessoas erraram essa questao
- `(sessaoId)` — relatorio de simulado

### Sessao

Container para um conjunto de respostas. Tipo:
- `ESTUDO`: estudo livre por filtro
- `SIMULADO`: cronometrado, fechado, com correcao final
- `REVISAO`: items vencidos do SM-2
- `LIVRE`: sem objetivo claro, raro

`configuracao` Json guarda filtros usados (banca, temas, dificuldade) — permite "repetir simulado" identico.

### ItemRevisao (SM-2 modificado)

Estado do SuperMemo-2 por (usuario, questao):
- `intervalo` em dias ate proxima revisao
- `repeticoes` consecutivas com sucesso
- `fatorFacilidade` (default 2.5, varia 1.3-2.5)
- `proximaRevisao` data calculada

Modificacao vs SM-2 puro: incorpora `confianca` da resposta. Acertar com chute conta menos que acertar com confianca. Ver [adr/0005-spaced-repetition-sm2-modified.md](adr/0005-spaced-repetition-sm2-modified.md).

Indice critico: `(userId, proximaRevisao)` — query "items vencidos hoje" e a mais frequente.

### PlanoEstudo + BlocoEstudo

`PlanoEstudo` e 1-1 com `User`. Regenerado:
- A cada onboarding completo
- Semanalmente via cron
- Apos cada 50 respostas (limiar para sinal estatistico)

`BlocoEstudo` e o agendamento granular: semana X, dia Y, tipo (TEORIA / QUESTOES / REVISAO / SIMULADO), tema sugerido, duracao. Status muda conforme usuario cumpre.

---

## Computado

### AnaliseIncidencia

Pre-computada por job. Chave: `(bancaId, temaId, janelaAnos)`.

Campos:
- `totalQuestoes`: contagem na janela
- `porcentagem`: peso relativo dentro da banca
- `tendencia`: delta vs janela anterior — capta temas em alta

Recomputada quando:
- Nova prova importada
- Nova questao classificada em tema diferente
- Cron diario (idempotente)

Por que pre-computar? Calcular em request-path requer join em milhoes de respostas + agregar por tema com peso. Inviavel.

### embedding (pgvector)

Em `Questao` e `Guideline`. Modelo: `text-embedding-3-small` da OpenAI (1536 dim, $0.02/1M tokens).

Usos:
- Busca semantica de guideline relacionado a questao
- "Questoes parecidas com essa" para revisao direcionada
- Clustering para detectar duplicatas durante import

Indice: HNSW (`vector_cosine_ops`).

---

## SaaS

### Assinatura (B2C)

1-1 com `User`. Espelha estado do Stripe — webhook atualiza. Plano:
- `FREE`: 100 questoes/mes, 1 simulado/semana, sem IA
- `PRO`: ilimitado, IA basica (50 explicacoes IA/mes)
- `PREMIUM`: ilimitado, IA ilimitada, geracao de questoes, prioridade em fila

### Organization + AssinaturaOrg (B2B)

Para cursinhos. `Organization` tem `seats` (vagas pagas). Admins convidam membros via Clerk. Billing por seat.

---

## Integridade

### Invariantes mantidos pela aplicacao

1. `Questao.bancaId == Questao.prova.bancaId` (denormalizacao)
2. Exatamente uma `Alternativa` por `Questao` tem `correta = true`
3. `Resposta.correta` reflete `Alternativa.correta` no momento da resposta
4. `ItemRevisao` so existe se ja ha pelo menos uma `Resposta` da questao

Validados em testes integration. Migracoes que violam isso falham em CI.

### Soft-delete

NAO usamos. Delete e delete. Excecao: usuario deletado mantem suas respostas anonimizadas (foreign key vira null) para preservar `AnaliseIncidencia` agregada — implementado via `onDelete: SetNull` em `Resposta.userId`.

Espera, isso conflita com LGPD direito ao esquecimento. Reconsiderar:
- Usuario pede delecao -> apaga User cascade em todas suas tabelas pessoais
- AnaliseIncidencia ja e agregada antes da delecao, nao impacta
- Decisao: delete duro com cascade, sem anonimizacao

---

## Migration strategy

- `prisma migrate dev` em desenvolvimento
- `prisma migrate deploy` em staging/prod via release command
- Migracoes destrutivas (drop column, change type) precisam de:
  1. Migration adicionando nova coluna
  2. Backfill via worker
  3. Code switch para nova coluna
  4. Migration removendo coluna antiga
- Nunca editar migration ja em prod
