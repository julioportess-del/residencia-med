import { prisma } from '@residencia-med/db'
import type { TipoNotificacao } from '@residencia-med/db'

/**
 * Helper para criar notificações in-app de qualquer parte do código (webhook,
 * worker, tRPC). Best-effort — não bloqueia o caller em caso de erro.
 */
export type NovaNotificacao = {
  userId: string
  tipo: TipoNotificacao
  titulo: string
  conteudo?: string
  link?: string
}

export async function criarNotificacao(n: NovaNotificacao): Promise<void> {
  try {
    await prisma.notificacao.create({ data: n })
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[notificacao] falha ao criar', e)
    }
  }
}
