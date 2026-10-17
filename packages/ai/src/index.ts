export { explicarErro, explicarErroStream } from './funcoes/explicar-erro'
export { mentorStream } from './funcoes/mentor'
export { validarSubmissao } from './funcoes/validar-submissao'
export type {
  SubmissaoInput,
  ResultadoValidacao,
  AlternativaSubmissao,
} from './funcoes/validar-submissao'
export { calcularCusto, registrarLLMCall } from './llm-call'
export { gerarQuestaoSimilar } from './funcoes/gerar-questao'
export { classificarTema } from './funcoes/classificar-tema'
export type { ClassificacaoTema, ClassificarTemaInput } from './funcoes/classificar-tema'
export { gerarEmbedding, gerarEmbeddings } from './funcoes/embedding'
export { buscarGuidelinePorTexto } from './funcoes/buscar-guideline'
export type { ExplicarErroInput, ExplicarErroOutput } from './funcoes/explicar-erro'
export type { GerarQuestaoInput, QuestaoGerada } from './funcoes/gerar-questao'
export type { MentorStreamInput, MentorStreamResultado, MensagemHistorico } from './funcoes/mentor'
export type { ContextoEstudante } from './prompts/mentor'
export { ANTHROPIC_HABILITADO, OPENAI_HABILITADO } from './clients'
export {
  extrairComentario,
  lerComentarioIa,
  montarRequisicaoComentario,
  montarRequisicaoClassificacao,
  MODELO_COMENTARIO_LOTE,
  MODELO_CLASSIFICACAO_LOTE,
  VERSAO_COMENTAR_QUESTAO,
} from './funcoes/comentar-questao'
export type { ComentarioQuestao, RequisicaoLote } from './funcoes/comentar-questao'
export { extrairJsonClassificacao } from './funcoes/classificar-tema'
export { enviarLote, consultarLote, lerResultadosLote } from './funcoes/lote'
export type { ResultadoLote, EstadoLote } from './funcoes/lote'
export { mensagemErroIA } from './erros'
