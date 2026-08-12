/** Configuração da extensão. */

export const API_BASE_PADRAO = 'https://escriba-escriba.vercel.app'

/**
 * Seletores de detecção de contexto no Feegow (app legado jQuery, rotas por
 * `?P=Pagina`). São BEST-EFFORT e calibráveis: a detecção só pré-preenche o
 * nome — o médico sempre vê e pode corrigir antes de gravar (mitiga o risco
 * de nota no paciente errado). Ajustar após inspeção com conta real.
 */
export const FEEGOW = {
  // Páginas onde o widget aparece (prontuário/atendimento). Vazio = todas.
  paginasAlvo: [] as string[],
  // Candidatos a conter o nome do paciente na tela de prontuário.
  seletoresNomePaciente: [
    '.nome-paciente',
    '#nome-paciente',
    '.patient-name',
    '[class*="nomePaciente"]',
    '.box-paciente h4',
    '.dados-paciente strong',
  ],
}

export const TIPOS_ATENDIMENTO = [
  ['PRIMEIRA_CONSULTA', 'Primeira consulta'],
  ['RETORNO', 'Retorno'],
  ['TELECONSULTA', 'Teleconsulta'],
  ['AVALIACAO', 'Avaliação'],
  ['PROCEDIMENTO', 'Procedimento'],
  ['OUTRO', 'Outro'],
] as const
