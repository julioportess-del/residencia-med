'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Circle, Loader2, Mic, Pause, Play, RotateCcw, Square } from 'lucide-react'
import { Button } from '@residencia-med/ui'

type Estado = 'ocioso' | 'gravando' | 'pausado' | 'finalizado'
type Envio = 'ocioso' | 'enviando' | 'erro'

function formatarTempo(segundos: number): string {
  const m = Math.floor(segundos / 60)
    .toString()
    .padStart(2, '0')
  const s = Math.floor(segundos % 60)
    .toString()
    .padStart(2, '0')
  return `${m}:${s}`
}

export function GravadorConsulta({ consultaId }: { consultaId: string }) {
  const router = useRouter()
  const [estado, setEstado] = useState<Estado>('ocioso')
  const [segundos, setSegundos] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const [audio, setAudio] = useState<{ blob: Blob; url: string } | null>(null)
  const [envio, setEnvio] = useState<Envio>('ocioso')
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const pararTimer = useCallback(() => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current)
      intervaloRef.current = null
    }
  }, [])

  const iniciarTimer = useCallback(() => {
    pararTimer()
    intervaloRef.current = setInterval(() => setSegundos((s) => s + 1), 1000)
  }, [pararTimer])

  const liberarStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      pararTimer()
      liberarStream()
      setAudio((a) => {
        if (a) URL.revokeObjectURL(a.url)
        return null
      })
    }
  }, [pararTimer, liberarStream])

  async function iniciar() {
    setErro(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setAudio({ blob, url: URL.createObjectURL(blob) })
        liberarStream()
        setEstado('finalizado')
      }
      recorder.start()
      recorderRef.current = recorder
      setSegundos(0)
      iniciarTimer()
      setEstado('gravando')
    } catch {
      setErro('Não foi possível acessar o microfone. Verifique a permissão do navegador.')
    }
  }

  function pausar() {
    recorderRef.current?.pause()
    pararTimer()
    setEstado('pausado')
  }

  function retomar() {
    recorderRef.current?.resume()
    iniciarTimer()
    setEstado('gravando')
  }

  function finalizar() {
    pararTimer()
    recorderRef.current?.stop()
  }

  function regravar() {
    setAudio((a) => {
      if (a) URL.revokeObjectURL(a.url)
      return null
    })
    setErroEnvio(null)
    setEnvio('ocioso')
    setSegundos(0)
    setEstado('ocioso')
  }

  async function gerarProntuario() {
    if (!audio) return
    setEnvio('enviando')
    setErroEnvio(null)
    try {
      const extensao = (audio.blob.type.split('/')[1] || 'webm').split(';')[0]
      const form = new FormData()
      form.append('audio', audio.blob, `consulta.${extensao}`)

      const resp = await fetch(`/api/consultas/${consultaId}/transcrever`, {
        method: 'POST',
        body: form,
      })
      const dados = (await resp.json().catch(() => null)) as
        | { ok: true; id: string }
        | { ok: false; erro: string }
        | null

      if (!resp.ok || !dados || dados.ok === false) {
        setErroEnvio(
          (dados && 'erro' in dados && dados.erro) ||
            'Não foi possível gerar o prontuário. Tente novamente.',
        )
        setEnvio('erro')
        return
      }

      // Libera o áudio da memória do navegador assim que o texto já existe.
      URL.revokeObjectURL(audio.url)
      router.replace(`/consultas/${consultaId}`)
    } catch {
      setErroEnvio('Falha de conexão ao enviar o áudio. Verifique a rede e tente novamente.')
      setEnvio('erro')
    }
  }

  if (estado === 'finalizado' && audio) {
    if (envio === 'enviando') {
      return (
        <div className="space-y-5 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium">Gerando prontuário…</p>
            <p className="text-sm text-muted-foreground">
              Transcrevendo o áudio e estruturando a evolução (SOAP, corrida e UBS). Pode levar
              alguns instantes — não feche esta aba.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <Check className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium">Gravação concluída</p>
          <p className="text-sm text-muted-foreground">
            Duração de {formatarTempo(segundos)}. O áudio fica só no seu dispositivo até a
            transcrição.
          </p>
        </div>
        <audio controls src={audio.url} className="w-full" />

        {erroEnvio ? (
          <p role="alert" className="text-sm text-destructive">
            {erroEnvio}
          </p>
        ) : null}

        <div className="space-y-2">
          <Button size="lg" className="w-full" onClick={gerarProntuario}>
            {envio === 'erro' ? 'Tentar novamente' : 'Gerar prontuário'}
          </Button>
          <Button size="lg" variant="ghost" className="w-full" onClick={regravar}>
            <RotateCcw className="h-4 w-4" />
            Regravar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          A transcrição mantém só o conteúdo clínico. O áudio não é armazenado no servidor.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className={
            estado === 'gravando'
              ? 'inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive'
              : 'inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground'
          }
        >
          {estado === 'gravando' ? (
            <Circle className="h-8 w-8 animate-pulse fill-current" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </div>
        <p className="font-mono text-3xl tabular-nums">{formatarTempo(segundos)}</p>
        <p className="text-sm text-muted-foreground">
          {estado === 'gravando'
            ? 'Gravando…'
            : estado === 'pausado'
              ? 'Pausado'
              : 'Pronto para gravar'}
        </p>
      </div>

      {erro ? (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      <div className="flex justify-center gap-3">
        {estado === 'ocioso' ? (
          <Button size="lg" onClick={iniciar}>
            <Mic className="h-4 w-4" />
            Iniciar gravação
          </Button>
        ) : null}

        {estado === 'gravando' ? (
          <Button size="lg" variant="outline" onClick={pausar}>
            <Pause className="h-4 w-4" />
            Pausar
          </Button>
        ) : null}

        {estado === 'pausado' ? (
          <Button size="lg" variant="outline" onClick={retomar}>
            <Play className="h-4 w-4" />
            Retomar
          </Button>
        ) : null}

        {estado === 'gravando' || estado === 'pausado' ? (
          <Button size="lg" variant="destructive" onClick={finalizar}>
            <Square className="h-4 w-4" />
            Finalizar
          </Button>
        ) : null}
      </div>
    </div>
  )
}
