// Conta linhas por tabela que seriam apagadas no reset do dashboard.
// Não altera nada — só SELECT COUNT().
import { PrismaClient } from '@prisma/client'

const EMAIL = 'julioportess@gmail.com'

const prisma = new PrismaClient()

const user = await prisma.user.findUnique({ where: { email: EMAIL } })
if (!user) {
  console.error(`Nenhum usuário com email ${EMAIL}`)
  process.exit(1)
}
console.log(
  `\nUser encontrado: id=${user.id} email=${user.email} name=${user.name ?? '(sem nome)'}\n`,
)

const userId = user.id

// Ordem: filhas antes de pais (pra o DELETE depois seguir a mesma)
const grupos = [
  // Flashcards
  {
    nome: 'RevisaoFlashcard (via Flashcard do user)',
    query: prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM "RevisaoFlashcard" rf JOIN "Flashcard" f ON f.id = rf."flashcardId" WHERE f."userId" = ${userId}`,
  },
  { nome: 'Flashcard', query: prisma.flashcard.count({ where: { userId } }) },
  { nome: 'Deck', query: prisma.deck.count({ where: { userId } }) },
  // Respostas & sessões
  { nome: 'Resposta', query: prisma.resposta.count({ where: { userId } }) },
  { nome: 'Sessao', query: prisma.sessao.count({ where: { userId } }) },
  // SRS tradicional
  { nome: 'ItemRevisao', query: prisma.itemRevisao.count({ where: { userId } }) },
  // Caderno de erros
  { nome: 'RegistroErro', query: prisma.registroErro.count({ where: { userId } }) },
  // LMS
  { nome: 'ProgressoAula', query: prisma.progressoAula.count({ where: { userId } }) },
  // Vigília
  { nome: 'SessaoVigilia', query: prisma.sessaoVigilia.count({ where: { userId } }) },
  // Gamificação & proficiência
  { nome: 'Nivel', query: prisma.nivel.count({ where: { userId } }) },
  { nome: 'Proficiencia', query: prisma.proficiencia.count({ where: { userId } }) },
  // Minhas provas
  { nome: 'ProcessoSeletivo', query: prisma.processoSeletivo.count({ where: { userId } }) },
  // Plano de estudo
  {
    nome: 'BlocoEstudo (via PlanoEstudo do user)',
    query: prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM "BlocoEstudo" b JOIN "PlanoEstudo" p ON p.id = b."planoId" WHERE p."userId" = ${userId}`,
  },
  { nome: 'PlanoEstudo', query: prisma.planoEstudo.count({ where: { userId } }) },
  // Perfil psicológico (usuário pediu apagar)
  { nome: 'PerfilCandidato', query: prisma.perfilCandidato.count({ where: { userId } }) },
  // Mentor IA
  {
    nome: 'MensagemMentor (via ConversaMentor do user)',
    query: prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM "MensagemMentor" m JOIN "ConversaMentor" c ON c.id = m."conversaId" WHERE c."userId" = ${userId}`,
  },
  { nome: 'ConversaMentor', query: prisma.conversaMentor.count({ where: { userId } }) },
  // Submissões (usuário pediu apagar, mas questões aprovadas ficam no banco)
  { nome: 'SubmissaoQuestao', query: prisma.submissaoQuestao.count({ where: { userId } }) },
  // Notificações & push
  { nome: 'Notificacao', query: prisma.notificacao.count({ where: { userId } }) },
  { nome: 'PushSubscription', query: prisma.pushSubscription.count({ where: { userId } }) },
  // LLM logs pessoais
  { nome: 'LLMCall', query: prisma.lLMCall.count({ where: { userId } }) },
  // Simulado live
  { nome: 'ParticipanteLive', query: prisma.participanteLive.count({ where: { userId } }) },
  // A/B
  {
    nome: 'AtribuicaoExperimento',
    query: prisma.atribuicaoExperimento.count({ where: { userId } }),
  },
  { nome: 'EventoExperimento', query: prisma.eventoExperimento.count({ where: { userId } }) },
]

const linhas = []
for (const g of grupos) {
  let n
  const res = await g.query
  if (Array.isArray(res)) n = Number(res[0]?.n ?? 0)
  else n = Number(res ?? 0)
  linhas.push({ tabela: g.nome, linhas: n })
}

// Preservadas (mostra também, zero mexe nelas)
const preservadas = [
  { nome: 'User (sua conta)', query: prisma.user.count({ where: { id: userId } }) },
  { nome: 'Assinatura (plano)', query: prisma.assinatura.count({ where: { userId } }) },
]
const preservadasLinhas = []
for (const g of preservadas) {
  const n = Number(await g.query)
  preservadasLinhas.push({ tabela: g.nome, linhas: n })
}

console.log('=== TABELAS QUE SERÃO LIMPAS ===')
console.table(linhas)
console.log('=== TABELAS PRESERVADAS ===')
console.table(preservadasLinhas)

const total = linhas.reduce((a, b) => a + b.linhas, 0)
console.log(`\nTotal de linhas a deletar: ${total}`)
console.log(`userId alvo: ${userId}`)

await prisma.$disconnect()
