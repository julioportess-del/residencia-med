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
export { gerarEmbedding, gerarEmbeddings } from './funcoes/embedding'
export { buscarGuidelinePorTexto } from './funcoes/buscar-guideline'
export type { ExplicarErroInput, ExplicarErroOutput } from './funcoes/explicar-erro'
export type { GerarQuestaoInput, QuestaoGerada } from './funcoes/gerar-questao'
export type { MentorStreamInput, MentorStreamResultado, MensagemHistorico } from './funcoes/mentor'
export type { ContextoEstudante } from './prompts/mentor'
export { ANTHROPIC_HABILITADO, OPENAI_HABILITADO } from './clients'
