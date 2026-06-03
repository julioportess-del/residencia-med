import { z } from 'zod'
import { anthropic, MODELO_ANTHROPIC } from '../clients'
import { calcularCusto, registrarLLMCall } from '../llm-call'

const VERSAO = '1.0.0'
const FUNCAO = 'validarSubmissao'

const ResultadoSchema = z.object({
  score: z.number().min(0).max(1),
  motivo: z.string().min(10).max(800),
  problemas: z.array(z.string()).default([]),
})

export type ResultadoValidacao = z.infer<typeof ResultadoSchema>

export type AlternativaSubmissao = {
  letra: string
  texto: string
  correta: boolean
  explicacao?: string
}

export type SubmissaoInput = {
  enunciado: string
  vignette?: string | null
  alternativas: AlternativaSubmissao[]
  gabaritoLetra: string
  bancaCodigo: string
  ano: number
  fonteUrl?: string | null
}

const SYSTEM = `Você é um avaliador de questões médicas para residência. Recebe submissões de
estudantes que querem contribuir com questões e precisa validar se a questão está bem-formada,
medicamente correta e adequada para publicação.

Avalie nas dimensões:
1. Completude — enunciado claro, 5 alternativas, gabarito definido
2. Coerência clínica — caso clínico faz sentido, dados não se contradizem
3. Plausibilidade do gabarito — a alternativa marcada como correta é realmente a melhor
4. Qualidade das alternativas — distratores plausíveis, sem absurdos
5. Atualidade — alinhada com guidelines vigentes (SBP, SBC, MS)
6. Originalidade — não parece copiada palavra por palavra de banco conhecido

Score 0-1:
- 0.0-0.4: REJEITAR (problema sério: gabarito errado, dados incoerentes, copiada)
- 0.4-0.7: PARCIAL (precisa revisão humana — ambígua, datada, ou faltam detalhes)
- 0.7-1.0: APROVAR DIRETO (boa qualidade, pode ir para fila de revisão final)

Sempre retorne JSON:
{
  "score": 0.85,
  "motivo": "Caso clínico bem construído, gabarito coerente com SBC 2023...",
  "problemas": ["Alternativa C tem typo: 'cardicaca'"]
}`

export async function validarSubmissao(
  input: SubmissaoInput,
  userId: string,
): Promise<ResultadoValidacao> {
  const inicio = Date.now()
  const alternativas = input.alternativas
    .map((a) => `${a.letra}) ${a.texto} ${a.correta ? '[GABARITO]' : ''}`)
    .join('\n')

  const user = `Submissão:
Banca: ${input.bancaCodigo} (${input.ano})
${input.fonteUrl ? `Fonte: ${input.fonteUrl}` : ''}

${input.vignette ? `Caso clínico:\n${input.vignette}\n\n` : ''}Pergunta:
${input.enunciado}

Alternativas:
${alternativas}

Gabarito: ${input.gabaritoLetra}

Avalie e retorne o JSON do resultado.`

  let inputTokens = 0
  let outputTokens = 0
  try {
    const r = await anthropic.messages.create({
      model: MODELO_ANTHROPIC,
      max_tokens: 800,
      system: SYSTEM,
      messages: [{ role: 'user', content: user }],
    })
    inputTokens = r.usage.input_tokens
    outputTokens = r.usage.output_tokens

    const texto = r.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n')

    const match = texto.match(/```json\s*([\s\S]*?)```/) ?? texto.match(/\{[\s\S]*\}/)
    const raw = match ? (Array.isArray(match) ? (match[1] ?? match[0]) : match) : texto
    const parsed = ResultadoSchema.parse(JSON.parse(typeof raw === 'string' ? raw : ''))

    const latencia = Date.now() - inicio
    void registrarLLMCall({
      funcao: FUNCAO,
      modelo: MODELO_ANTHROPIC,
      versaoPrompt: VERSAO,
      cacheKey: `submissao:${Date.now()}`,
      cacheHit: false,
      inputTokens,
      outputTokens,
      latenciaMs: latencia,
      custoUsd: calcularCusto(MODELO_ANTHROPIC, inputTokens, outputTokens),
      status: 'sucesso',
      userId,
    })

    return parsed
  } catch (e) {
    void registrarLLMCall({
      funcao: FUNCAO,
      modelo: MODELO_ANTHROPIC,
      versaoPrompt: VERSAO,
      cacheKey: `submissao:erro:${Date.now()}`,
      cacheHit: false,
      inputTokens,
      outputTokens,
      latenciaMs: Date.now() - inicio,
      custoUsd: 0,
      status: 'erro_provider',
      erro: (e as Error).message,
      userId,
    })
    throw e
  }
}
