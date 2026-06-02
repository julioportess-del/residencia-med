import { anthropic, MODELO_ANTHROPIC } from '../clients'

const MAX_TOKENS = 1500
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

const SYSTEM_ASSISTENTE = `Você é um assistente de APOIO À DECISÃO CLÍNICA para médicos brasileiros, com foco em Atenção Primária (UBS). Seu papel é ajudar o médico a raciocinar — nunca substituí-lo.

DIRETRIZES DE RESPOSTA:
- Responda em português brasileiro, de forma objetiva e prática para o contexto de UBS/SUS.
- Baseie-se em evidências e diretrizes reconhecidas (Ministério da Saúde, SBC, SBD, SBIm, sociedades de especialidade, protocolos clínicos e diretrizes terapêuticas). Quando fizer sentido, indique a força da recomendação ou nível de evidência.
- Para condutas: cite primeira linha, alternativas, posologia usual (dose, via, frequência, duração) e ajustes relevantes (idade, gestação, função renal/hepática) quando pertinente.
- Sinalize sinais de alarme e critérios de encaminhamento/urgência.
- Se a pergunta for ambígua ou faltar dado clínico essencial, pergunte antes de responder.
- Se não houver evidência suficiente ou o tema fugir da sua confiabilidade, diga isso claramente — não invente referências nem números.

LIMITES:
- Você fornece apoio à decisão, não prescrição. A responsabilidade e o julgamento finais são do médico.
- Não forneça orientação destinada diretamente ao paciente leigo; fale de médico para médico.
- Não solicite nem registre dados identificáveis de pacientes.

Encerre respostas com condutas/medicações com uma nota breve: "Apoio à decisão — confirme com a diretriz vigente e adapte ao paciente."`

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

/**
 * Assistente de apoio à decisão clínica (efêmero — nada é persistido).
 * Recebe o histórico do chat e devolve a resposta do assistente.
 *
 * Saída é APOIO À DECISÃO — não substitui o julgamento do médico. O chamador é
 * responsável por NÃO enviar dados identificáveis de paciente (apenas iniciais).
 */
export async function assistenteClinico(mensagens: MensagemChat[]): Promise<string> {
  const historico = validar(mensagens)

  const resposta = await anthropic.messages.create({
    model: MODELO_ANTHROPIC,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_ASSISTENTE,
    messages: historico.map((m) => ({ role: m.papel, content: m.conteudo })),
  })

  const texto = resposta.content
    .filter((bloco): bloco is { type: 'text'; text: string } => bloco.type === 'text')
    .map((bloco) => bloco.text)
    .join('')
    .trim()

  if (!texto) {
    throw new AssistenteEntradaInvalidaError('O assistente não retornou resposta. Tente novamente.')
  }
  return texto
}
