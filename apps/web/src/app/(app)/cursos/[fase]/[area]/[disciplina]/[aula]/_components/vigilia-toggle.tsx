'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/cn'
import { trpc } from '@/lib/trpc/client'

/**
 * Vigília — monitor de presença cognitiva (nome clínico do IPC).
 * Câmera roda LOCAL no navegador; o backend só recebe duração da sessão
 * (não frames, não features biométricas). Consent explícito antes de ligar.
 */
export function VigiliaToggle({ aulaId }: { aulaId?: string }) {
  const [consentModal, setConsentModal] = useState(false)
  const [ativa, setAtiva] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sessaoIdRef = useRef<string | null>(null)
  const utils = trpc.useUtils()

  const iniciarMut = trpc.vigilia.iniciar.useMutation()
  const encerrarMut = trpc.vigilia.encerrar.useMutation()

  async function ligar() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setAtiva(true)
      setConsentModal(false)
      toast.success('Vigília ativada — a câmera só roda localmente.')
      // Registra início no backend (best-effort — não bloqueia o modo local)
      try {
        const res = await iniciarMut.mutateAsync({ aulaId })
        sessaoIdRef.current = res.id
      } catch {
        // Falha de rede não deve derrubar a Vigília local
      }
    } catch {
      toast.error('Não consegui acessar a câmera.')
    }
  }

  async function desligar() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setAtiva(false)
    const id = sessaoIdRef.current
    sessaoIdRef.current = null
    if (id) {
      try {
        await encerrarMut.mutateAsync({ id })
        utils.vigilia.resumo.invalidate()
      } catch {
        // Silencioso — métrica
      }
    }
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      // Encerra métrica em background ao desmontar (não await — unmount é síncrono)
      const id = sessaoIdRef.current
      if (id) {
        encerrarMut.mutate({ id })
        sessaoIdRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => (ativa ? desligar() : setConsentModal(true))}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
          ativa
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border text-muted-foreground hover:bg-secondary',
        )}
        title="Monitor local de atenção (Vigília)"
      >
        {ativa ? <Camera className="size-3.5" /> : <CameraOff className="size-3.5" />}
        Vigília {ativa ? 'ON' : 'OFF'}
        {ativa && <span className="size-1.5 animate-pulse rounded-full bg-primary" />}
      </button>

      {/* Preview da câmera quando ativa (pequeno, canto) */}
      {ativa && (
        <div className="fixed bottom-4 right-4 z-40 overflow-hidden rounded-lg border bg-background shadow-xl">
          <video ref={videoRef} muted playsInline className="h-24 w-32 scale-x-[-1] object-cover" />
          <div className="flex items-center justify-between gap-2 px-2 py-1 text-[10px] text-muted-foreground">
            <span>Vigília · local</span>
            <button
              onClick={desligar}
              className="font-medium text-primary hover:underline"
              type="button"
            >
              Desligar
            </button>
          </div>
        </div>
      )}

      <Dialog open={consentModal} onOpenChange={setConsentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              Ativar Vigília
            </DialogTitle>
            <DialogDescription>
              Vigília é um monitor local de atenção. Ajuda você a manter foco durante uma aula ao
              mostrar um indicador contínuo de que a webcam está te vendo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <ul className="space-y-2 text-muted-foreground">
              <li>
                • A câmera roda <strong>só no seu navegador</strong>.
              </li>
              <li>
                • <strong>Nenhum frame</strong> é enviado para nossos servidores.
              </li>
              <li>
                • Guardamos apenas a <strong>duração</strong> da sessão (segundos), pra você ver seu
                tempo acumulado em foco. Nenhum vídeo, nenhuma biometria.
              </li>
              <li>
                • Você pode desligar a qualquer momento no botão da Vigília ou no painel pequeno que
                aparece no canto.
              </li>
              <li>
                • Permissão compatível com <abbr title="Lei Geral de Proteção de Dados">LGPD</abbr>:
                dado biométrico não é coletado nem persistido.
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setConsentModal(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={ligar}>
              <Camera className="size-4" /> Prosseguir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
