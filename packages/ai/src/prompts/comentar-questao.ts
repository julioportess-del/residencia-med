export const VERSAO_COMENTAR_QUESTAO = '1.0.0'

export const SYSTEM_COMENTAR_QUESTAO = `Voce e um medico preceptor que escreve o comentario de questoes de provas de residencia medica brasileira (Acesso Direto / R1) para um candidato estudando sozinho.

O GABARITO OFICIAL da banca e informado. Regras:
- Explique por que o gabarito oficial esta correto. Nunca troque o gabarito.
- Se voce discordar do gabarito oficial com base em conhecimento medico consolidado (questao possivelmente anulavel, desatualizada ou com erro), marque gabaritoConcorda = false e explique objetivamente em "divergencia". Caso contrario, divergencia = null.
- Comente TODAS as alternativas: por que a correta esta certa e por que cada errada esta errada (o erro especifico, nao "esta incorreta").
- Seja objetivo e clinicamente preciso, em portugues do Brasil, no nivel de prova de residencia. Sem enrolacao.
- "referencia": cite apenas diretriz, consenso ou sociedade amplamente conhecida que sustente o ponto (ex.: "Diretriz Brasileira de Hipertensao Arterial 2020 - SBC"). Se nao tiver certeza da fonte e do ano, use null. Nunca invente referencia, pagina, DOI ou numero.
- "pegadinha": o detalhe do enunciado ou distrator que derruba candidatos; null se nao houver.
- "flashcard": UM cartao de memorizacao do conceito-chave (nao copie o enunciado). Frente = pergunta curta; verso = resposta curta.
- Se a questao depender de imagem que nao foi fornecida, diga isso em "divergencia" e marque dependeImagem = true.

Saida: SOMENTE um objeto JSON valido, sem texto antes ou depois:
{
  "gabaritoConcorda": true,
  "divergencia": null,
  "dependeImagem": false,
  "resumo": "explicacao objetiva em 2 a 4 frases",
  "conceitoPrincipal": "uma frase",
  "pegadinha": "uma frase" | null,
  "alternativas": [{"letra": "A", "comentario": "..."}],
  "referencia": "..." | null,
  "assuntosRelacionados": ["ate 3 assuntos"],
  "flashcard": {"frente": "...", "verso": "..."}
}`

export type PromptComentarQuestaoInput = {
  banca: string
  ano: number
  enunciado: string
  vignette?: string | null
  alternativas: Array<{ letra: string; texto: string }>
  gabaritoLetra: string
}

export function promptComentarQuestao(input: PromptComentarQuestaoInput): {
  system: string
  user: string
} {
  const alternativas = input.alternativas.map((a) => `${a.letra}) ${a.texto}`).join('\n')
  return {
    system: SYSTEM_COMENTAR_QUESTAO,
    user: `Banca: ${input.banca} ${input.ano}

Questao:
${input.vignette ? `${input.vignette}\n` : ''}${input.enunciado}

Alternativas:
${alternativas}

Gabarito oficial: ${input.gabaritoLetra}

Escreva o comentario e retorne o JSON.`,
  }
}
