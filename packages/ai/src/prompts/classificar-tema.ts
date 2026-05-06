export const VERSAO_CLASSIFICAR_TEMA = '1.0.0'

export const SYSTEM_CLASSIFICAR_TEMA = `Voce classifica questoes de residencia medica em uma taxonomia hierarquica fechada.

Regras:
- Escolha entre 1 e 3 temas, por ordem de relevancia.
- Use apenas codigos da lista fornecida — nao invente.
- Tema primario com peso 1.0; secundarios entre 0.3 e 0.5.
- Saida JSON: array de { codigoTema, peso, primario }.`

export type PromptClassificarTemaInput = {
  enunciado: string
  vignette?: string
  temasDisponiveis: Array<{ codigo: string; nome: string; especialidade: string }>
}

export function promptClassificarTema(input: PromptClassificarTemaInput): {
  system: string
  user: string
} {
  const taxonomia = input.temasDisponiveis
    .map((t) => `${t.codigo} (${t.especialidade}): ${t.nome}`)
    .join('\n')

  return {
    system: SYSTEM_CLASSIFICAR_TEMA,
    user: `Taxonomia disponivel:
${taxonomia}

Questao:
${input.vignette ?? ''}
${input.enunciado}

Classifique em ate 3 temas. Retorne JSON conforme schema.`,
  }
}
