/**
 * Perfil psicológico multi-item (autoavaliação Likert 1-5).
 *
 * Substitui o pick-one por dimensão por somatório ponderado de 3-5 itens
 * por dimensão. O resultado final ainda é um enum (compatível com o schema
 * do PerfilCandidato), mas a classificação vem de score numérico, não de
 * uma única escolha.
 *
 * Importante: não são escalas psicométricas validadas (PSS-10, BFI etc.).
 * São autoavaliações multi-item inspiradas em escalas públicas, pensadas
 * pra calibrar a UX do plano — não pra diagnóstico clínico.
 */

export type PerfilDisc = 'ANALISTA' | 'COMUNICADOR' | 'EXECUTOR' | 'CONCILIADOR'
export type PerfilSocioemocional = 'TAREFAS' | 'PESSOAS' | 'IDEIAS' | 'SISTEMAS'
export type PerfilProcrastinacao = 'LEVE' | 'MODERADA' | 'SEVERA'
export type PerfilMemoria = 'BAIXA' | 'MEDIA' | 'ACIMA_DA_MEDIA' | 'ALTA'

export type ValorLikert = 1 | 2 | 3 | 4 | 5

type ItemDisc = {
  id: string
  texto: string
  dimensao: PerfilDisc
  invertido?: boolean
}
type ItemSocio = {
  id: string
  texto: string
  dimensao: PerfilSocioemocional
  invertido?: boolean
}
type ItemLikert = {
  id: string
  texto: string
  invertido?: boolean
}

/**
 * Itens de perfil comportamental (adaptados de DISC não-clínico).
 * 3 itens por estilo = 12 total. Cada item pontua pra UM estilo; o resultado
 * é o estilo com maior score agregado.
 */
export const ITENS_DISC: ReadonlyArray<ItemDisc> = [
  { id: 'd01', dimensao: 'ANALISTA', texto: 'Analiso tudo em detalhe antes de agir.' },
  { id: 'd02', dimensao: 'ANALISTA', texto: 'Prefiro dados e evidências a opiniões.' },
  {
    id: 'd03',
    dimensao: 'ANALISTA',
    texto: 'Me incomoda tomar decisão sem informação suficiente.',
  },

  { id: 'd04', dimensao: 'COMUNICADOR', texto: 'Aprendo melhor explicando para outra pessoa.' },
  { id: 'd05', dimensao: 'COMUNICADOR', texto: 'Grupos de estudo me energizam.' },
  { id: 'd06', dimensao: 'COMUNICADOR', texto: 'Expresso o que penso com facilidade.' },

  { id: 'd07', dimensao: 'EXECUTOR', texto: 'Vou direto à ação — faço, depois ajusto.' },
  { id: 'd08', dimensao: 'EXECUTOR', texto: 'Me frustro com análises longas demais.' },
  { id: 'd09', dimensao: 'EXECUTOR', texto: 'Prefiro resolver um problema por vez, rápido.' },

  { id: 'd10', dimensao: 'CONCILIADOR', texto: 'Mantenho ritmo constante, sem picos.' },
  { id: 'd11', dimensao: 'CONCILIADOR', texto: 'Prezo pela harmonia com quem estuda comigo.' },
  { id: 'd12', dimensao: 'CONCILIADOR', texto: 'Evito mudanças bruscas na rotina.' },
] as const

/**
 * Itens de motivação socioemocional (adaptados de modelos de orientação de valor).
 * 3 por motivador = 12 total.
 */
export const ITENS_SOCIO: ReadonlyArray<ItemSocio> = [
  { id: 's01', dimensao: 'TAREFAS', texto: 'Terminar o que planejei me dá satisfação.' },
  { id: 's02', dimensao: 'TAREFAS', texto: 'Metas concretas me movem.' },
  { id: 's03', dimensao: 'TAREFAS', texto: 'Prefiro listas a conversas abertas.' },

  { id: 's04', dimensao: 'PESSOAS', texto: 'Estudar com outras pessoas me motiva.' },
  { id: 's05', dimensao: 'PESSOAS', texto: 'Me importo com quem está no mesmo processo que eu.' },
  { id: 's06', dimensao: 'PESSOAS', texto: 'A qualidade do grupo influencia meu aprendizado.' },

  { id: 's07', dimensao: 'IDEIAS', texto: 'Aprender coisa nova me energiza.' },
  { id: 's08', dimensao: 'IDEIAS', texto: 'Gosto de entender o "porquê", não só o "como".' },
  { id: 's09', dimensao: 'IDEIAS', texto: 'Já perdi hora lendo algo tangencial que me chamou.' },

  { id: 's10', dimensao: 'SISTEMAS', texto: 'Organização me acalma e me faz render.' },
  { id: 's11', dimensao: 'SISTEMAS', texto: 'Processos bem definidos me ajudam a performar.' },
  {
    id: 's12',
    dimensao: 'SISTEMAS',
    texto: 'Rotina clara é mais produtiva que improviso pra mim.',
  },
] as const

/**
 * Procrastinação acadêmica — 5 itens Likert 1-5 inspirados na escala de Lay.
 * Score 5-25 → classifica em LEVE / MODERADA / SEVERA.
 */
export const ITENS_PROCRASTINACAO: ReadonlyArray<ItemLikert> = [
  { id: 'p01', texto: 'Costumo adiar o estudo pra fazer coisas menos importantes.' },
  { id: 'p02', texto: 'Deixo tarefas difíceis pro último momento.' },
  { id: 'p03', texto: 'Começo a estudar depois do horário que planejei.' },
  { id: 'p04', texto: 'Mesmo com prazo, demoro pra iniciar.' },
  { id: 'p05', texto: 'Cumpro minhas metas de estudo diárias.', invertido: true },
] as const

/**
 * Autoeficácia de memória — 4 itens Likert 1-5.
 * Score 4-20 → classifica em BAIXA / MEDIA / ACIMA_DA_MEDIA / ALTA.
 */
export const ITENS_MEMORIA: ReadonlyArray<ItemLikert> = [
  { id: 'm01', texto: 'Lembro bem do que estudei nas últimas semanas.' },
  { id: 'm02', texto: 'Preciso de poucas revisões pra fixar um tema novo.' },
  { id: 'm03', texto: 'Depois de uma leitura atenta, consigo explicar o conteúdo.' },
  { id: 'm04', texto: 'Esqueço rápido o que não revisei.', invertido: true },
] as const

export type RespostasLape = Record<string, ValorLikert>

function somaItens(itens: ReadonlyArray<ItemLikert>, respostas: RespostasLape): number {
  let total = 0
  for (const item of itens) {
    const v = respostas[item.id]
    if (v === undefined) continue
    total += item.invertido ? 6 - v : v
  }
  return total
}

function somaItensPorDimensao<T extends string>(
  itens: ReadonlyArray<{ id: string; dimensao: T; invertido?: boolean }>,
  respostas: RespostasLape,
): Map<T, number> {
  const scores = new Map<T, number>()
  for (const item of itens) {
    const v = respostas[item.id]
    if (v === undefined) continue
    const pontos = item.invertido ? 6 - v : v
    scores.set(item.dimensao, (scores.get(item.dimensao) ?? 0) + pontos)
  }
  return scores
}

function argmax<T>(scores: Map<T, number>): T | null {
  let melhor: T | null = null
  let maior = -Infinity
  for (const [chave, valor] of scores) {
    if (valor > maior) {
      maior = valor
      melhor = chave
    }
  }
  return melhor
}

export function classificarProcrastinacao(score: number): PerfilProcrastinacao {
  // Faixas sobre total 5-25
  if (score <= 12) return 'LEVE'
  if (score <= 18) return 'MODERADA'
  return 'SEVERA'
}

export function classificarMemoria(score: number): PerfilMemoria {
  // Faixas sobre total 4-20
  if (score <= 8) return 'BAIXA'
  if (score <= 12) return 'MEDIA'
  if (score <= 16) return 'ACIMA_DA_MEDIA'
  return 'ALTA'
}

export type ResultadoLape = {
  disc: PerfilDisc | null
  socioemocional: PerfilSocioemocional | null
  procrastinacao: PerfilProcrastinacao | null
  memoria: PerfilMemoria | null
  scores: {
    disc: Record<PerfilDisc, number>
    socioemocional: Record<PerfilSocioemocional, number>
    procrastinacao: number
    memoria: number
  }
  completo: boolean
}

function completoPorDimensao(
  itens: ReadonlyArray<{ id: string }>,
  respostas: RespostasLape,
): boolean {
  return itens.every((i) => respostas[i.id] !== undefined)
}

export function calcularPerfilLape(respostas: RespostasLape): ResultadoLape {
  const scoresDisc = somaItensPorDimensao(ITENS_DISC, respostas)
  const scoresSocio = somaItensPorDimensao(ITENS_SOCIO, respostas)
  const scoreProcrast = somaItens(ITENS_PROCRASTINACAO, respostas)
  const scoreMem = somaItens(ITENS_MEMORIA, respostas)

  const discCompleto = completoPorDimensao(ITENS_DISC, respostas)
  const socioCompleto = completoPorDimensao(ITENS_SOCIO, respostas)
  const procrastCompleto = completoPorDimensao(ITENS_PROCRASTINACAO, respostas)
  const memCompleto = completoPorDimensao(ITENS_MEMORIA, respostas)

  const discFinal = discCompleto ? argmax(scoresDisc) : null
  const socioFinal = socioCompleto ? argmax(scoresSocio) : null
  const procrastFinal = procrastCompleto ? classificarProcrastinacao(scoreProcrast) : null
  const memFinal = memCompleto ? classificarMemoria(scoreMem) : null

  return {
    disc: discFinal,
    socioemocional: socioFinal,
    procrastinacao: procrastFinal,
    memoria: memFinal,
    scores: {
      disc: {
        ANALISTA: scoresDisc.get('ANALISTA') ?? 0,
        COMUNICADOR: scoresDisc.get('COMUNICADOR') ?? 0,
        EXECUTOR: scoresDisc.get('EXECUTOR') ?? 0,
        CONCILIADOR: scoresDisc.get('CONCILIADOR') ?? 0,
      },
      socioemocional: {
        TAREFAS: scoresSocio.get('TAREFAS') ?? 0,
        PESSOAS: scoresSocio.get('PESSOAS') ?? 0,
        IDEIAS: scoresSocio.get('IDEIAS') ?? 0,
        SISTEMAS: scoresSocio.get('SISTEMAS') ?? 0,
      },
      procrastinacao: scoreProcrast,
      memoria: scoreMem,
    },
    completo: discCompleto && socioCompleto && procrastCompleto && memCompleto,
  }
}
