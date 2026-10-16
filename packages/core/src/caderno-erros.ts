/**
 * Caderno de erros automático: toda questão que você já errou entra aqui,
 * com o que você anotou (motivo, conceito correto, anotação). Também detecta
 * padrões — vários erros no mesmo tema sugerem deficiência conceitual comum.
 */
import { resumirHistorico, type RespostaHistorico } from './banco-questoes'

export type MotivoErro =
  | 'FALTA_CONHECIMENTO'
  | 'CONCEITO_ERRADO'
  | 'LEITURA_ENUNCIADO'
  | 'PEGADINHA'
  | 'ESQUECIMENTO'
  | 'DESATENCAO'
  | 'OUTRO'

export const ROTULO_MOTIVO_ERRO: Record<MotivoErro, string> = {
  FALTA_CONHECIMENTO: 'Não sabia o conteúdo',
  CONCEITO_ERRADO: 'Achava que sabia (conceito errado)',
  LEITURA_ENUNCIADO: 'Li o enunciado errado',
  PEGADINHA: 'Caí na pegadinha',
  ESQUECIMENTO: 'Sabia, mas esqueci',
  DESATENCAO: 'Desatenção / cansaço',
  OUTRO: 'Outro',
}

export type RegistroErroDados = {
  questaoId: string
  motivo: MotivoErro | null
  conceitoCorreto: string | null
  anotacao: string | null
  resolvido: boolean
}

export type StatusErro = 'ABERTO' | 'CORRIGIDO' | 'RESOLVIDO'

export type EntradaCaderno = {
  questaoId: string
  tema: string | null
  area: string | null
  /** ABERTO: última tentativa errada · CORRIGIDO: acertou depois · RESOLVIDO: você marcou. */
  status: StatusErro
  tentativas: number
  erros: number
  ultimoErroEm: Date
  motivo: MotivoErro | null
  conceitoCorreto: string | null
  anotacao: string | null
  proximaRevisao: Date | null
}

const ORDEM_STATUS: Record<StatusErro, number> = { ABERTO: 0, CORRIGIDO: 1, RESOLVIDO: 2 }

export function montarCadernoErros(dados: {
  respostas: readonly RespostaHistorico[]
  registros: readonly RegistroErroDados[]
  metadados: ReadonlyMap<string, { tema: string | null; area: string | null }>
  proximasRevisoes: ReadonlyMap<string, Date>
}): EntradaCaderno[] {
  const historico = resumirHistorico(dados.respostas)
  const registros = new Map(dados.registros.map((r) => [r.questaoId, r]))

  const ultimoErro = new Map<string, Date>()
  const contagemErros = new Map<string, number>()
  for (const r of dados.respostas) {
    if (r.correta) continue
    contagemErros.set(r.questaoId, (contagemErros.get(r.questaoId) ?? 0) + 1)
    const atual = ultimoErro.get(r.questaoId)
    if (!atual || r.createdAt > atual) ultimoErro.set(r.questaoId, r.createdAt)
  }

  const entradas: EntradaCaderno[] = []
  for (const [questaoId, resumo] of historico) {
    if (!resumo.jaErrou) continue
    const reg = registros.get(questaoId)
    const meta = dados.metadados.get(questaoId)
    const status: StatusErro = reg?.resolvido
      ? 'RESOLVIDO'
      : resumo.ultimaCorreta
        ? 'CORRIGIDO'
        : 'ABERTO'
    entradas.push({
      questaoId,
      tema: meta?.tema ?? null,
      area: meta?.area ?? null,
      status,
      tentativas: resumo.tentativas,
      erros: contagemErros.get(questaoId) ?? 0,
      ultimoErroEm: ultimoErro.get(questaoId) ?? resumo.ultimaEm,
      motivo: reg?.motivo ?? null,
      conceitoCorreto: reg?.conceitoCorreto ?? null,
      anotacao: reg?.anotacao ?? null,
      proximaRevisao: dados.proximasRevisoes.get(questaoId) ?? null,
    })
  }

  return entradas.sort(
    (a, b) =>
      ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status] ||
      b.ultimoErroEm.getTime() - a.ultimoErroEm.getTime(),
  )
}

/** Mínimo de erros abertos no mesmo tema para apontar um padrão. */
export const LIMIAR_PADRAO_ERRO = 3

export type PadraoErro = {
  tema: string
  area: string | null
  quantidade: number
  motivoPredominante: MotivoErro | null
  recomendacao: string
}

function recomendar(motivo: MotivoErro | null, tema: string): string {
  switch (motivo) {
    case 'CONCEITO_ERRADO':
      return `Revise a base teórica de ${tema}: os erros sugerem um conceito aprendido de forma incorreta.`
    case 'FALTA_CONHECIMENTO':
      return `Estude ${tema} antes de fazer mais questões do tema.`
    case 'LEITURA_ENUNCIADO':
    case 'DESATENCAO':
      return `Em ${tema}, o problema parece ser leitura: sublinhe o que a questão pede antes de ler as alternativas.`
    case 'PEGADINHA':
      return `Em ${tema}, anote os distratores que te derrubaram e refaça as questões erradas.`
    case 'ESQUECIMENTO':
      return `${tema} precisa de revisão espaçada mais frequente (flashcards do conceito-chave).`
    default:
      return `Vários erros em ${tema}: refaça essas questões e registre o motivo de cada erro para identificar a causa.`
  }
}

export function detectarPadroesErro(entradas: readonly EntradaCaderno[]): PadraoErro[] {
  const porTema = new Map<string, EntradaCaderno[]>()
  for (const e of entradas) {
    if (e.status !== 'ABERTO' || !e.tema) continue
    porTema.set(e.tema, [...(porTema.get(e.tema) ?? []), e])
  }

  return [...porTema.entries()]
    .filter(([, lista]) => lista.length >= LIMIAR_PADRAO_ERRO)
    .map(([tema, lista]) => {
      const contagem = new Map<MotivoErro, number>()
      for (const e of lista) if (e.motivo) contagem.set(e.motivo, (contagem.get(e.motivo) ?? 0) + 1)
      const motivoPredominante = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
      return {
        tema,
        area: lista[0]?.area ?? null,
        quantidade: lista.length,
        motivoPredominante,
        recomendacao: recomendar(motivoPredominante, tema),
      }
    })
    .sort((a, b) => b.quantidade - a.quantidade)
}
