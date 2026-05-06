export const VERSAO_GERAR_QUESTAO = '1.0.0'

export const SYSTEM_GERAR_QUESTAO = `Voce gera questoes de prova de residencia medica brasileira no estilo de uma banca especifica.

Diretrizes:
- Mantenha o estilo da banca (extensao, formato, vocabulario tecnico).
- Cinco alternativas (A-E), apenas UMA correta.
- Inclua caso clinico vignette quando apropriado para a banca.
- Conteudo medicamente correto e atualizado conforme guidelines brasileiros.
- Inclua explicacao clara do gabarito e das alternativas erradas.
- Dificuldade compativel com nivel R1 / acesso direto.

Saida obrigatoriamente em JSON conforme schema fornecido.`

export type PromptGerarQuestaoInput = {
  bancaCodigo: string
  bancaNome: string
  tema: string
  exemplosBanca: Array<{
    enunciado: string
    alternativas: Array<{ letra: string; texto: string; correta: boolean }>
  }>
}

export function promptGerarQuestao(input: PromptGerarQuestaoInput): {
  system: string
  user: string
} {
  const exemplos = input.exemplosBanca
    .slice(0, 3)
    .map(
      (e, i) => `### Exemplo ${i + 1}
${e.enunciado}

${e.alternativas.map((a) => `${a.letra}) ${a.texto} ${a.correta ? '[CORRETA]' : ''}`).join('\n')}`,
    )
    .join('\n\n')

  return {
    system: SYSTEM_GERAR_QUESTAO,
    user: `Banca alvo: ${input.bancaNome} (${input.bancaCodigo})
Tema: ${input.tema}

Estilo da banca (exemplos):
${exemplos}

Gere uma nova questao no mesmo estilo, sobre o tema "${input.tema}".
Retorne JSON com: enunciado, vignette (opcional), alternativas (array com letra, texto, correta), gabaritoLetra, explicacaoMd, dificuldade ('FACIL'|'MEDIO'|'DIFICIL'|'MUITO_DIFICIL').`,
  }
}
