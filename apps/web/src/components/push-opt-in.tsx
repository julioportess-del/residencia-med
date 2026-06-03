'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc/client'

/**
 * Botão para o usuário ativar/desativar notificações push web.
 * Renderiza nada se VAPID não está configurado no servidor (modo demo).
 */
export function PushOptIn() {
  const status = trpc.push.status.useQuery()
  const vapidKey = trpc.push.vapidPublicKey.useQuery()

  const inscrever = trpc.push.inscrever.useMutation()
  const cancelar = trpc.push.cancelar.useMutation()

  const [permissao, setPermissao] = useState<NotificationPermission | 'unsupported'>('default')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermissao('unsupported')
      return
    }
    setPermissao(Notification.permission)
  }, [])

  if (!status.data?.vapidConfigurado) return null
  if (permissao === 'unsupported') return null

  const inscrito = status.data?.inscrito ?? false
  const podeAtivar = permissao !== 'denied'

  const ativar = async () => {
    if (!vapidKey.data) {
      toast.error('VAPID não configurado')
      return
    }
    setCarregando(true)
    try {
      const perm = permissao === 'granted' ? 'granted' : await Notification.requestPermission()
      setPermissao(perm)
      if (perm !== 'granted') {
        toast.error('Permissão negada — habilite nas configurações do navegador.')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey.data),
      })
      const json = sub.toJSON() as {
        endpoint?: string
        keys?: { p256dh?: string; auth?: string }
      }
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
        throw new Error('subscription incompleta')
      }
      await inscrever.mutateAsync({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        userAgent: navigator.userAgent.slice(0, 500),
      })
      toast.success('Notificações ativadas')
      await status.refetch()
    } catch (e) {
      toast.error((e as Error).message ?? 'Falha ao ativar')
    } finally {
      setCarregando(false)
    }
  }

  const desativar = async () => {
    setCarregando(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await cancelar.mutateAsync({ endpoint: sub.endpoint })
      }
      toast.success('Notificações desativadas')
      await status.refetch()
    } catch (e) {
      toast.error((e as Error).message ?? 'Falha ao desativar')
    } finally {
      setCarregando(false)
    }
  }

  if (inscrito) {
    return (
      <Button variant="outline" size="sm" onClick={desativar} loading={carregando}>
        <BellOff className="size-4" />
        Desativar push
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={ativar}
      loading={carregando}
      disabled={!podeAtivar}
    >
      <Bell className="size-4" />
      Ativar notificações
    </Button>
  )
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}
