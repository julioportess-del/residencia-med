import { prisma } from '@residencia-med/db'
import type { TipoNotificacao } from '@residencia-med/db'
import { enviarPush, pushHabilitado } from '@residencia-med/email/push'

/**
 * Helper para criar notificações in-app + dispara push web (best-effort).
 *
 * Pipeline:
 *   1. Insert na tabela Notificacao (sino mostra ao próximo refetch)
 *   2. Se VAPID configurado, envia push para todas as subscriptions do user
 *      em paralelo. Subscriptions expiradas (404/410) são removidas.
 */
export type NovaNotificacao = {
  userId: string
  tipo: TipoNotificacao
  titulo: string
  conteudo?: string
  link?: string
  enviarPush?: boolean // default true
}

export async function criarNotificacao(n: NovaNotificacao): Promise<void> {
  try {
    await prisma.notificacao.create({
      data: {
        userId: n.userId,
        tipo: n.tipo,
        titulo: n.titulo,
        conteudo: n.conteudo,
        link: n.link,
      },
    })
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[notificacao] falha ao criar in-app', e)
    }
    return
  }

  if (n.enviarPush === false) return
  if (!pushHabilitado()) return

  void enviarPushParaUsuario(n.userId, {
    titulo: n.titulo,
    conteudo: n.conteudo,
    link: n.link,
    tipo: n.tipo,
  }).catch(() => {})
}

async function enviarPushParaUsuario(
  userId: string,
  payload: { titulo: string; conteudo?: string; link?: string; tipo?: string },
) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (subs.length === 0) return

  const expiradas: string[] = []
  await Promise.all(
    subs.map(async (s) => {
      const r = await enviarPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, payload)
      if (r.expirada) expiradas.push(s.id)
    }),
  )
  if (expiradas.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: expiradas } },
    })
  }
}
