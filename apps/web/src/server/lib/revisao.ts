import { aplicarSM2 } from '@residencia-med/core'
import type { PrismaClient } from '@residencia-med/db'

type DadosResposta = {
  userId: string
  questaoId: string
  correta: boolean
  tempoSegundos: number
  confianca: 'CHUTE' | 'INCERTO' | 'CONFIANTE' | null
}

/**
 * Atualiza o item de repetição espaçada da questão logo após a resposta.
 * Roda inline (sem fila): antes dependia de Redis + worker e, sem eles,
 * nenhum item de revisão era criado.
 */
export async function atualizarItemRevisao(
  prisma: PrismaClient,
  r: DadosResposta,
): Promise<{ proximaRevisao: Date }> {
  const chave = { userId_questaoId: { userId: r.userId, questaoId: r.questaoId } }
  const [user, itemAtual] = await Promise.all([
    prisma.user.findUnique({ where: { id: r.userId }, select: { dataProva: true } }),
    prisma.itemRevisao.findUnique({ where: chave }),
  ])

  const novo = aplicarSM2(
    itemAtual
      ? {
          intervalo: itemAtual.intervalo,
          repeticoes: itemAtual.repeticoes,
          fatorFacilidade: itemAtual.fatorFacilidade,
          qualidade: itemAtual.qualidade,
          ultimaRevisao: itemAtual.ultimaRevisao,
          proximaRevisao: itemAtual.proximaRevisao,
        }
      : null,
    { correta: r.correta, tempoSegundos: r.tempoSegundos, confianca: r.confianca ?? undefined },
    { dataProva: user?.dataProva ?? null },
  )

  const dados = {
    intervalo: novo.intervalo,
    repeticoes: novo.repeticoes,
    fatorFacilidade: novo.fatorFacilidade,
    qualidade: novo.qualidade,
    ultimaRevisao: novo.ultimaRevisao,
    proximaRevisao: novo.proximaRevisao,
  }
  await prisma.itemRevisao.upsert({
    where: chave,
    create: { userId: r.userId, questaoId: r.questaoId, ...dados },
    update: dados,
  })
  return { proximaRevisao: novo.proximaRevisao }
}
