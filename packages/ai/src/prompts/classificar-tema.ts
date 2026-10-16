export const VERSAO_CLASSIFICAR_TEMA = '2.0.0'

export const SYSTEM_CLASSIFICAR_TEMA = `Voce e um medico preceptor que classifica questoes de prova de residencia medica brasileira numa taxonomia FECHADA de temas.

Regras:
- Escolha UM tema primario: o assunto central que a questao cobra (o que o candidato precisa saber para acertar), nao o cenario. Ex.: gestante com pielonefrite cobrando conduta antibiotica no pre-natal -> pre-natal; crianca com pneumonia cobrando antibiotico -> infectologia pediatrica.
- Use SOMENTE codigos da lista fornecida, copiados exatamente. Nunca invente codigo.
- Se nenhum tema da lista cobre o assunto central (ex.: neurologia, ortopedia, urologia, hematologia, dermatologia, oftalmologia, etica medica), responda codigoTema = null. Nao force um tema errado so para preencher.
- Prefira o tema mais especifico quando houver hierarquia (ex.: fibrilacao atrial em vez de arritmias), desde que ele de fato cubra a questao.
- Secundarios: ate 2 codigos da lista que a questao tambem cobra de forma relevante; lista vazia se nao houver.
- confianca: numero de 0 a 1 de quanto voce tem certeza do tema primario.
- justificativa: uma frase curta em portugues.

Saida: SOMENTE um objeto JSON, sem texto antes ou depois:
{"codigoTema": "CODIGO" | null, "secundarios": ["CODIGO"], "confianca": 0.0, "justificativa": "..."}`

export type PromptClassificarTemaInput = {
  enunciado: string
  vignette?: string
  alternativas?: Array<{ letra: string; texto: string }>
  temasDisponiveis: Array<{ codigo: string; nome: string; especialidade: string }>
}

export function promptClassificarTema(input: PromptClassificarTemaInput): {
  system: string
  user: string
} {
  const taxonomia = input.temasDisponiveis
    .map((t) => `${t.codigo} (${t.especialidade}): ${t.nome}`)
    .join('\n')

  const alternativas = (input.alternativas ?? []).map((a) => `${a.letra}) ${a.texto}`).join('\n')

  return {
    system: SYSTEM_CLASSIFICAR_TEMA,
    user: `Taxonomia disponivel:
${taxonomia}

Questao:
${input.vignette ? `${input.vignette}\n` : ''}${input.enunciado}
${alternativas ? `\nAlternativas:\n${alternativas}` : ''}

Classifique e retorne o JSON.`,
  }
}
