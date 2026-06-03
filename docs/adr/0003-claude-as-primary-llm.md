# ADR 0003 — Claude como LLM primario; OpenAI para embeddings

**Status:** Aceito
**Data:** 2026-05-05

## Contexto

Precisamos de:

1. Explicar erro de questao com raciocinio clinico (caso clinico longo + 5 alternativas + guideline)
2. Gerar questoes sinteticas no estilo de uma banca
3. Classificar tema de questao (zero-shot)
4. Buscar guideline semanticamente similar (embedding)

Avaliamos Claude (Anthropic), GPT-4 (OpenAI), Gemini (Google).

## Decisao

**Primario**: Anthropic Claude Sonnet 4.6 (raciocinio + geracao + classificacao).
**Embeddings**: OpenAI `text-embedding-3-small` (1536 dim).
**Fallback**: GPT-4o quando Anthropic indisponivel (rare).

## Racional

### Por que Claude para raciocinio

- **Casos clinicos longos**: Claude lida melhor com contexto longo (200k tokens) sem perder a alternativa B no meio
- **Citacao de guideline**: Claude e mais conservador em afirmacoes medicas e respeita melhor instrucoes "cite o trecho exato do guideline"
- **Prompt caching nativo**: cacheamos enunciado + alternativas + gabarito + guideline (cabecalhos pesados). Reuso entre N usuarios respondendo mesma questao = ~80% reducao de custo
- **Structured output via tool use**: para gerar questao em JSON estruturado, Claude com tools beats prompt engineering puro
- **Vies de seguranca**: em duvida clinica, Claude tende a recusar afirmacao questionavel — comportamento desejavel em produto medico

### Por que OpenAI para embeddings

- `text-embedding-3-small`: $0.02/1M tokens, 1536 dim — relacao custo/qualidade imbatível em embedding
- Anthropic ainda nao oferece embeddings publicos
- Embedding nao precisa de raciocinio; modelo barato basta

### Por que nao Gemini

- API menos estavel comparada
- Pricing competitivo mas integracao com nossa stack (Vercel AI SDK) pior

## Implementacao

### Camada `packages/ai`

```typescript
// Funcoes de alto nivel — tudo cacheado
explicarErro(input: ExplicarErroInput): Promise<string>
gerarQuestaoSimilar(input: GerarQuestaoInput): Promise<QuestaoGerada>
classificarTema(enunciado: string): Promise<TemaCandidato[]>
buscarGuidelinePorTexto(query: string, k: number): Promise<Guideline[]>
gerarEmbedding(texto: string): Promise<number[]>
```

### Cache

Chave de cache: `sha256({funcao, args, modelo, versaoPrompt})`.

Duas camadas:

1. Redis (TTL 24h) — hot cache
2. Postgres `LLMCall` table — permanente, util para audit + custo

### Custo por usuario (alvo)

| Plano   | Tokens IA/mes                                   | Custo aproximado |
| ------- | ----------------------------------------------- | ---------------- |
| FREE    | 0 (sem IA)                                      | $0               |
| PRO     | 50 explicacoes (~500k tokens com cache hit 80%) | ~$0.30/mes       |
| PREMIUM | 200 explicacoes + 20 questoes geradas           | ~$1.50/mes       |

Margem confortavel a $19/$39.

## Riscos

- **Claude indisponivel**: fallback OpenAI implementado mas com prompt diferente; pode dar respostas inconsistentes. Aceitamos para uptime.
- **Mudanca de pricing Anthropic**: rastreado em `LLMCall.custoUsd`; alarme se custo/usuario subir 30% em 7 dias.
- **Hallucination medica**: cada explicacao IA mostra disclaimer + link para guideline citada. Em caso de divergencia, usuario reporta.

## Pontos de re-avaliar

- Se Anthropic lancar embedding competitivo: mover tudo pra Anthropic
- Se Gemini 2.5 mostrar paridade + 50% mais barato: A/B test
- Se cache hit ratio cair <60%: investigar — provavelmente prompts variando demais

## Referencia

- https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- https://platform.openai.com/docs/guides/embeddings
