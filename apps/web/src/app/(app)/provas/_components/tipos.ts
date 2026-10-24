import type { inferRouterOutputs } from '@trpc/server'
import type { ProcessoSeletivoInput } from '@residencia-med/types'
import type { AppRouter } from '@/server/routers/_app'

export type ProcessoListado = inferRouterOutputs<AppRouter>['minhasProvas']['listar'][number]

/** Converte o item listado de volta no formato de entrada (para edição e toggles rápidos). */
export function paraInput(p: ProcessoListado): ProcessoSeletivoInput {
  return {
    instituicao: p.instituicao,
    bancaId: p.bancaId,
    especialidade: p.especialidade,
    numeroInscricao: p.numeroInscricao,
    editalPublicado: p.editalPublicado,
    linkEdital: p.linkEdital,
    inscricaoFeita: p.inscricaoFeita,
    inscricaoPaga: p.inscricaoPaga,
    taxaInscricaoCentavos: p.taxaInscricaoCentavos,
    logisticaOrganizada: p.logisticaOrganizada,
    cidadeProva: p.cidadeProva,
    inicioInscricoes: p.inicioInscricoes,
    fimInscricoes: p.fimInscricoes,
    dataProva: p.dataProva,
    provaRealizada: p.provaRealizada,
    acertos: p.acertos,
    totalQuestoes: p.totalQuestoes,
    observacoes: p.observacoes,
  }
}
