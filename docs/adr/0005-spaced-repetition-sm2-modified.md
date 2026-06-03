# ADR 0005 — Repeticao espacada: SM-2 modificado com sinal de confianca

**Status:** Aceito
**Data:** 2026-05-05

## Contexto

Plataforma usa repeticao espacada para cravar conhecimento. Algoritmos disponiveis:

1. **SM-2** (SuperMemo, 1987) — base do Anki, simples, eficaz
2. **FSRS** (Free Spaced Repetition Scheduler, 2023) — ML-based, melhor retencao mas complexo
3. **Leitner system** — caixas, simples demais para nosso caso

## Decisao

**SM-2 modificado**, incorporando `confianca` auto-reportada da resposta.

Migracao para FSRS planejada para v2 quando tivermos dados (>1M respostas).

## Algoritmo

### SM-2 puro (referencia)

Para cada (usuario, questao):

- `intervalo` (dias ate proxima revisao) — default 1
- `repeticoes` (acertos consecutivos) — default 0
- `EF` (ease factor) — default 2.5, range [1.3, 2.5+]

Usuario responde com qualidade `q ∈ [0, 5]`:

```
se q < 3:
  repeticoes = 0
  intervalo = 1
senao:
  se repeticoes == 0: intervalo = 1
  elif repeticoes == 1: intervalo = 6
  else: intervalo = round(intervalo * EF)
  repeticoes += 1
EF = max(1.3, EF + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
proximaRevisao = hoje + intervalo dias
```

### Modificacao 1: derivar `q` de (correta, tempo, confianca)

Em vez do usuario auto-reportar 0-5 explicitamente (atrito alto), inferimos:

```typescript
function calcularQualidade(resposta: Resposta): number {
  if (!resposta.correta) {
    if (resposta.confianca === 'CONFIANTE') return 0 // pior — confiante e errou
    if (resposta.confianca === 'INCERTO') return 1
    return 2 // chute — menos punitivo
  }
  // correta
  const rapidoOk = resposta.tempoSegundos < 60
  if (resposta.confianca === 'CONFIANTE' && rapidoOk) return 5
  if (resposta.confianca === 'CONFIANTE') return 4
  if (resposta.confianca === 'INCERTO') return 3
  return 3 // chute correto — nao reforca demais
}
```

### Modificacao 2: piso de intervalo conforme proximidade da prova

Se `dataProva - hoje < 30 dias`, capa intervalo em 7 dias — proximo da prova, revisao mais frequente.

```typescript
const diasAteProva = differenceInDays(user.dataProva, hoje)
if (diasAteProva < 30) intervalo = Math.min(intervalo, 7)
if (diasAteProva < 7) intervalo = Math.min(intervalo, 2)
```

### Modificacao 3: novidade vs revisao

Primeira tentativa nao usa SM-2. Cria `ItemRevisao` so na segunda exposicao OU quando usuario erra. Evita poluir o pool com questoes acertadas trivialmente.

## Implementacao

```typescript
// packages/core/src/spacedRepetition.ts
export function aplicarSM2(
  item: ItemRevisao | null,
  resposta: Resposta,
  ctx: { dataProva?: Date },
): ItemRevisaoNovo {
  const q = calcularQualidade(resposta)
  if (!item) {
    // primeira vez OU resposta correta de novidade
    return novoItem(resposta, q)
  }
  let { intervalo, repeticoes, fatorFacilidade: ef } = item
  if (q < 3) {
    repeticoes = 0
    intervalo = 1
  } else {
    if (repeticoes === 0) intervalo = 1
    else if (repeticoes === 1) intervalo = 6
    else intervalo = Math.round(intervalo * ef)
    repeticoes += 1
  }
  ef = Math.max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))

  // teto de intervalo conforme proximidade da prova
  if (ctx.dataProva) {
    const dias = differenceInDays(ctx.dataProva, new Date())
    if (dias < 30) intervalo = Math.min(intervalo, 7)
    if (dias < 7) intervalo = Math.min(intervalo, 2)
  }

  return {
    intervalo,
    repeticoes,
    fatorFacilidade: ef,
    qualidade: q,
    ultimaRevisao: new Date(),
    proximaRevisao: addDays(new Date(), intervalo),
  }
}
```

Roda em worker apos cada `Resposta` create. Idempotente (job key = `${userId}:${questaoId}:${respostaId}`).

## Testes

Cenarios cobertos:

- Sequencia de acertos com confianca: intervalo cresce 1, 6, 13, 28...
- Erro confiante reseta tudo
- Chute correto nao acelera intervalo
- Capping perto da prova
- Idempotencia (mesma resposta processada duas vezes nao avanca duas vezes)

## Por que nao FSRS

- Requer treinar modelo com >1k respostas do proprio usuario
- Curva de cold start ruim
- Implementacao mais complexa
- Diferenca empirica vs SM-2 modificado: ~15% menos repeticoes para mesma retencao
- v2 quando tivermos dados de >100k usuarios para treinar default

## Re-avaliar

- Se retencao em prova real (medida via simulado mock 30 dias antes) for <70%: investigar
- Se >50% dos usuarios acharem que itens sao "muito frequentes" ou "muito raros": ajustar pesos
- v2: experimentar FSRS-5 com dados acumulados
