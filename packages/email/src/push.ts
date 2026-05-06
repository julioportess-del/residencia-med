/**
 * Web Push notifications. Compartilha o pacote @residencia-med/email só por
 * conveniência (são as duas formas de "comunicação para fora" — email e push).
 *
 * Requer VAPID keys nas envs:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...)
 *
 * Geração das keys: `npx web-push generate-vapid-keys` (uma vez, persistir em
 * Vercel env vars).
 */
import webPush from 'web-push'

let configurado = false

function configurar(): boolean {
  if (configurado) return true
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subj = process.env.VAPID_SUBJECT ?? 'mailto:contato@residencia-med.com'
  if (!pub || !priv || pub.includes('placeholder') || priv.includes('placeholder')) {
    return false
  }
  webPush.setVapidDetails(subj, pub, priv)
  configurado = true
  return true
}

export type PushPayload = {
  titulo: string
  conteudo?: string
  link?: string
  tipo?: string
}

export type PushSubInfo = {
  endpoint: string
  p256dh: string
  auth: string
}

export type PushResultado = {
  ok: boolean
  motivo?: string
  expirada?: boolean
}

/**
 * Envia uma push para uma única subscription. Retorna {ok, expirada} —
 * caller deve remover do banco quando expirada=true (404/410).
 */
export async function enviarPush(
  sub: PushSubInfo,
  payload: PushPayload,
): Promise<PushResultado> {
  if (!configurar()) {
    return { ok: false, motivo: 'VAPID não configurado (modo demo)' }
  }
  try {
    await webPush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 },
    )
    return { ok: true }
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode
    if (status === 404 || status === 410) {
      return { ok: false, motivo: 'subscription expirada', expirada: true }
    }
    return { ok: false, motivo: (e as Error).message }
  }
}

export function pushHabilitado(): boolean {
  return configurar()
}
