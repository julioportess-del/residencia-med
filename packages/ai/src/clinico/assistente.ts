import { anthropic, MODELO_ANTHROPIC } from '../clients'
import { formatarEvidenciasParaPrompt, type Evidencia } from './evidencias'

const MAX_TOKENS = 2000
const MAX_MENSAGENS = 20
const MAX_CARACTERES_MENSAGEM = 4000

export type PapelChat = 'user' | 'assistant'

export interface MensagemChat {
  papel: PapelChat
  conteudo: string
}

export class AssistenteEntradaInvalidaError extends Error {
  constructor(detalhe: string) {
    super(detalhe)
    this.name = 'AssistenteEntradaInvalidaError'
  }
}

const SYSTEM_ASSISTENTE = `Você é um assistente de pesquisa médica e APOIO À DECISÃO CLÍNICA para médicos brasileiros, baseado estritamente em Medicina Baseada em Evidências (MBE).

HIERARQUIA DE EVIDÊNCIAS (nesta ordem de prioridade):
1. Diretrizes clínicas atuais: Ministério da Saúde/PCDT, sociedades médicas brasileiras (SBC, SBD, SBIm, Febrasgo, SBP...) e internacionais (AHA, ESC, ADA, GOLD, GINA...).
2. Revisões sistemáticas e metanálises (Cochrane).
3. Ensaios clínicos randomizados.
4. Estudos observacionais e consensos de especialistas (declarando a fragilidade).

RIGOR NAS REFERÊNCIAS (regra crítica):
- Quando houver uma lista numerada de EVIDÊNCIAS DISPONÍVEIS no contexto, cite-as como [1], [2]... — são fontes reais verificadas pelo sistema; a seção de referências deve ser construída a partir DELAS, com o link markdown fornecido.
- Você pode complementar nomeando diretrizes/sociedades e ano que conheça com segurança (ex.: "Diretriz Brasileira de HAS — SBC, 2020"), mas NUNCA invente DOI, PMID, título exato de estudo ou link que não esteja na lista. Na dúvida, cite só sociedade/ano e recomende confirmar.
- Se não houver evidência sólida para a pergunta, declare explicitamente que não há consenso ou dados suficientes — jamais preencha a lacuna com suposição.

ESTRUTURA DA RESPOSTA (em markdown):
- **Resumo direto** — resposta objetiva à dúvida clínica (1-3 frases).
- **Evidência e conduta** — manejo detalhado: critérios diagnósticos, opções de 1ª e 2ª linha com posologia usual (dose, via, frequência, duração) e ajustes relevantes (idade, gestação, função renal/hepática), indicando nível de evidência/grau de recomendação quando aplicável. Sinais de alarme e critérios de encaminhamento quando pertinente.
- **Contexto nacional** — quando relevante, diferenças entre diretrizes internacionais e protocolos vigentes no Brasil (SUS/PCDT/ANVISA, disponibilidade na rede).
- **Referências** — lista final formatada (sociedade/autor, ano, título; link apenas das evidências fornecidas).
Para perguntas simples/pontuais, seja proporcional — não force todas as seções.

SEGURANÇA E ÉTICA:
- Linguagem técnica, de médico para médico; apoio à decisão, não prescrição — o julgamento final é do médico.
- Se a pergunta for ambígua ou faltar dado clínico essencial, pergunte antes de responder.
- Não solicite nem registre dados identificáveis de pacientes (LGPD/CFM).

Encerre respostas com condutas/medicações com: "Apoio à decisão — confirme com a diretriz vigente e adapte ao paciente."`

function validar(mensagens: MensagemChat[]): MensagemChat[] {
  if (!Array.isArray(mensagens) || mensagens.length === 0) {
    throw new AssistenteEntradaInvalidaError('Envie ao menos uma mensagem.')
  }
  if (mensagens.length > MAX_MENSAGENS) {
    throw new AssistenteEntradaInvalidaError('Conversa muito longa. Inicie uma nova.')
  }
  const limpas = mensagens.map((m) => {
    if (m.papel !== 'user' && m.papel !== 'assistant') {
      throw new AssistenteEntradaInvalidaError('Papel de mensagem inválido.')
    }
    const conteudo = (m.conteudo ?? '').trim()
    if (!conteudo) throw new AssistenteEntradaInvalidaError('Mensagem vazia.')
    return { papel: m.papel, conteudo: conteudo.slice(0, MAX_CARACTERES_MENSAGEM) }
  })
  if (limpas[limpas.length - 1]?.papel !== 'user') {
    throw new AssistenteEntradaInvalidaError('A última mensagem deve ser do médico.')
  }
  return limpas
}

const MAX_CARACTERES_CONTEXTO = 16_000

/**
 * Assistente de apoio à decisão clínica (efêmero — nada é persistido).
 * Recebe o histórico do chat e devolve a resposta do assistente.
 *
 * `contexto` (opcional): dados da consulta atual montados pelo chamador
 * (transcrição, evolução, informações clínicas do paciente) para respostas
 * situadas — ex.: "quais informações ainda não perguntei?".
 *
 * Saída é APOIO À DECISÃO — não substitui o julgamento do médico. O chamador é
 * responsável por NÃO enviar dados identificáveis de paciente (apenas iniciais).
 */
export async function assistenteClinico(
  mensagens: MensagemChat[],
  contexto?: string,
  evidencias?: Evidencia[],
): Promise<string> {
  const historico = validar(mensagens)

  const contextoLimpo = contexto?.trim().slice(0, MAX_CARACTERES_CONTEXTO)
  const blocoEvidencias =
    evidencias && evidencias.length > 0
      ? `\n\nEVIDÊNCIAS DISPONÍVEIS (reais, verificadas pelo sistema — cite como [n] e use nos links das referências):\n${evidencias
          .map(
            (e, i) =>
              `${formatarEvidenciasParaPrompt([e]).replace('[1]', `[${i + 1}]`)}\nLink: [${e.titulo.slice(0, 80)}](${e.url})`,
          )
          .join('\n\n')}`
      : ''
  const system = [
    SYSTEM_ASSISTENTE,
    contextoLimpo
      ? `CONTEXTO DA CONSULTA ATUAL (fornecido pelo sistema — use como base factual; não repita ao médico o que ele já sabe, responda a pergunta):\n${contextoLimpo}`
      : null,
    blocoEvidencias || null,
  ]
    .filter(Boolean)
    .join('\n\n')

  const resposta = await anthropic.messages.create({
    model: MODELO_ANTHROPIC,
    max_tokens: MAX_TOKENS,
    system,
    messages: historico.map((m) => ({ role: m.papel, content: m.conteudo })),
  })

  const texto = resposta.content
    .map((bloco) => (bloco.type === 'text' ? bloco.text : ''))
    .join('')
    .trim()

  if (!texto) {
    throw new AssistenteEntradaInvalidaError('O assistente não retornou resposta. Tente novamente.')
  }
  return texto
}
