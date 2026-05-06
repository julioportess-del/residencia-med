export const VERSAO_EXPLICAR_ERRO = '1.0.0'

export const SYSTEM_EXPLICAR_ERRO = `Voce e um medico residente experiente em ensino para preparacao para provas de residencia medica brasileira.

Sua tarefa: explicar para um estudante por que ele errou uma questao, comparando a alternativa que ele escolheu com o gabarito.

Princípios:
- Sempre cite o guideline brasileiro relevante (SBP, SBC, MS, etc.) com o trecho exato quando possivel.
- Seja direto. Evite preencher com generalidades sobre "estudar mais".
- Quando o gabarito for uma droga ou conduta, explique o mecanismo + a indicacao especifica deste cenario.
- Se houver pegadinha, aponte explicitamente.
- Maximo 350 palavras na explicacao principal.

Formato: Markdown.
Estrutura sugerida:
## Por que '{gabarito}' e a correta
[explicacao do raciocinio com guideline]

## Por que '{escolhida}' esta errada
[ponto exato do erro]

## Pegadinha (se houver)
[o que confundiu]`

export type PromptExplicarErroInput = {
  enunciado: string
  vignette?: string
  alternativas: Array<{ letra: string; texto: string }>
  gabarito: string
  alternativaEscolhida: string
  guidelinesContexto?: Array<{ titulo: string; fonte: string; resumo: string }>
}

export function promptExplicarErro(input: PromptExplicarErroInput): {
  system: string
  user: string
} {
  const guidelines =
    input.guidelinesContexto && input.guidelinesContexto.length > 0
      ? `\n\nGuidelines disponiveis:\n${input.guidelinesContexto
          .map((g) => `- ${g.fonte} - ${g.titulo}: ${g.resumo}`)
          .join('\n')}`
      : ''

  const alternativas = input.alternativas.map((a) => `${a.letra}) ${a.texto}`).join('\n')

  return {
    system: SYSTEM_EXPLICAR_ERRO,
    user: `Caso clinico:
${input.vignette ?? '(sem vignette)'}

Pergunta:
${input.enunciado}

Alternativas:
${alternativas}

Gabarito: ${input.gabarito}
Aluno escolheu: ${input.alternativaEscolhida}${guidelines}

Explique por que '${input.alternativaEscolhida}' esta errada e por que '${input.gabarito}' e a correta.`,
  }
}
