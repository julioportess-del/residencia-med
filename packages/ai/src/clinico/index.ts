/**
 * Modulo de IA clinica do Escriba. Desacoplado do Prisma da plataforma de
 * estudos: importa apenas helpers DB-free (clients, cache). A auditoria de
 * uso e feita pelo proprio app via clinico.LogAcesso, nao por registrarLLMCall.
 */
export { estruturarConsulta, EstruturacaoInvalidaError } from './estruturar-consulta'
export { transcreverAudio, TranscricaoVaziaError } from './transcrever-audio'
export {
  renderizarEvolucoes,
  renderizarModelo,
  renderizarSoap,
  renderizarCorrida,
  renderizarUbs,
  type EvolucoesRenderizadas,
} from './render'
export {
  estruturaClinicaSchema,
  type EstruturaClinica,
  type CidSugerido,
  type ModeloEvolucaoTexto,
} from './tipos'
export {
  renderizarDocumento,
  documentosDisponiveis,
  TIPO_DOCUMENTO_LABEL,
  type TipoDocumento,
  type ContextoDocumento,
  type OpcoesAtestado,
} from './documentos'
export { VERSAO_PROMPT_ESTRUTURAR } from './prompt-estruturar'
export {
  assistenteClinico,
  AssistenteEntradaInvalidaError,
  type MensagemChat,
  type PapelChat,
} from './assistente'
export {
  analisarAnexosClinicos,
  AnaliseAnexosInvalidaError,
  type AnexoParaAnalise,
  type EntradaAnaliseAnexos,
} from './analisar-anexos'
