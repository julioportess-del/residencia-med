'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  Circle,
  Flag,
  Loader2,
  Mic,
  MonitorSpeaker,
  Pause,
  Play,
  RotateCcw,
  Square,
} from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { audioParaChunksWav, SEGUNDOS_POR_CHUNK } from '@/lib/audio-chunks'

type Estado = 'ocioso' | 'gravando' | 'pausado' | 'finalizado'
type Envio = 'ocioso' | 'enviando' | 'erro'
type Progresso = {
  fase: 'cortando' | 'transcrevendo' | 'estruturando'
  atual: number
  total: number
}

const CONCORRENCIA_CHUNKS = 8
const MAX_TENTATIVAS_CHUNK = 3

function formatarTempo(segundos: number): string {
  const m = Math.floor(segundos / 60)
    .toString()
    .padStart(2, '0')
  const s = Math.floor(segundos % 60)
    .toString()
    .padStart(2, '0')
  return `${m}:${s}`
}

interface GravadorConsultaProps {
  consultaId: string
  /** Pré-marca o modo de captura do áudio da chamada (teleconsulta). */
  teleconsulta?: boolean
}

export function GravadorConsulta({ consultaId, teleconsulta = false }: GravadorConsultaProps) {
  const router = useRouter()
  const [estado, setEstado] = useState<Estado>('ocioso')
  const [segundos, setSegundos] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const [audio, setAudio] = useState<{ blob: Blob; url: string } | null>(null)
  const [envio, setEnvio] = useState<Envio>('ocioso')
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [progresso, setProgresso] = useState<Progresso | null>(null)
  // Momentos importantes marcados pelo médico (segundos desde o início).
  const [marcas, setMarcas] = useState<number[]>([])
  const [marcaFeedback, setMarcaFeedback] = useState(false)
  // Teleconsulta: além do microfone, captura o áudio da ABA da chamada
  // (WhatsApp Web/Meet) — sem isso a voz do paciente não entra na gravação.
  const [modoChamada, setModoChamada] = useState(teleconsulta)
  const [chamadaAtiva, setChamadaAtiva] = useState(false)
  // Medidor de som + alerta de silêncio: avisa no 1º minuto, não depois de 20.
  const [nivelAudio, setNivelAudio] = useState(0)
  const [avisoSilencio, setAvisoSilencio] = useState(false)
  const [avisoChamada, setAvisoChamada] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chamadaStreamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const medidorRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const silencioDesdeRef = useRef<number | null>(null)
  // O medidor roda num setInterval (closure antiga): ref p/ saber se está gravando.
  const gravandoRef = useRef(false)
  const chunksRef = useRef<Blob[]>([])
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Marcas em ref: o onstop do recorder captura closures antigas — a ref
  // garante que a transcrição sempre veja as marcas atuais.
  const marcasRef = useRef<number[]>([])
  // Pré-transcrição em segundo plano: começa ao finalizar a gravação,
  // enquanto o médico revê o áudio. "Gerar prontuário" só espera o restante.
  const preTransRef = useRef<{ geracao: number; promessa: Promise<string> } | null>(null)
  const geracaoRef = useRef(0)

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
    chamadaStreamRef.current?.getTracks().forEach((t) => t.stop())
    chamadaStreamRef.current = null
    void audioCtxRef.current?.close().catch(() => undefined)
    audioCtxRef.current = null
    if (medidorRef.current) {
      clearInterval(medidorRef.current)
      medidorRef.current = null
    }
    silencioDesdeRef.current = null
    setChamadaAtiva(false)
    setNivelAudio(0)
    setAvisoSilencio(false)
  }, [])

  /** Mede o nível do áudio gravado e alerta se ficar mudo por >10 s. */
  const iniciarMedidor = useCallback((ctx: AudioContext, fontes: MediaStream[]) => {
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    for (const s of fontes) {
      if (s.getAudioTracks().length > 0) ctx.createMediaStreamSource(s).connect(analyser)
    }
    const dados = new Uint8Array(analyser.fftSize)
    medidorRef.current = setInterval(() => {
      analyser.getByteTimeDomainData(dados)
      let pico = 0
      for (let i = 0; i < dados.length; i++) {
        const desvio = Math.abs((dados[i] ?? 128) - 128)
        if (desvio > pico) pico = desvio
      }
      const nivel = Math.min(100, Math.round((pico / 128) * 300))
      setNivelAudio(nivel)
      if (!gravandoRef.current) {
        silencioDesdeRef.current = null
        setAvisoSilencio(false)
      } else if (nivel < 3) {
        silencioDesdeRef.current ??= Date.now()
        setAvisoSilencio(Date.now() - (silencioDesdeRef.current ?? 0) > 10_000)
      } else {
        silencioDesdeRef.current = null
        setAvisoSilencio(false)
      }
    }, 250)
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

    // getUserMedia exige contexto seguro: https OU localhost. Em http via IP
    // da rede (ex.: 192.168.x.x), navigator.mediaDevices nem existe.
    if (!navigator.mediaDevices?.getUserMedia) {
      setErro(
        'O microfone só funciona em conexão segura (https) ou em localhost. ' +
          'Abra o app pelo endereço https publicado, não pelo IP da rede.',
      )
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      setAvisoChamada(null)

      // Teleconsulta: captura também o áudio da ABA da chamada e mistura com
      // o microfone — senão a voz do paciente (que sai pelo alto-falante/fone)
      // ficaria fora da gravação.
      let streamChamada: MediaStream | null = null
      if (modoChamada) {
        try {
          streamChamada = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          })
        } catch {
          liberarStream()
          setErro(
            'Captura da chamada cancelada. Clique em Iniciar de novo e, na janela do Chrome, escolha a ABA da chamada (WhatsApp/Meet) e marque "Compartilhar áudio da guia".',
          )
          return
        }
        if (streamChamada.getAudioTracks().length === 0) {
          streamChamada.getTracks().forEach((t) => t.stop())
          liberarStream()
          setErro(
            'A aba escolhida veio SEM áudio. Tente de novo: selecione a aba "Guia do Chrome" da chamada e marque a caixa "Compartilhar áudio da guia" no canto da janela.',
          )
          return
        }
        chamadaStreamRef.current = streamChamada
        setChamadaAtiva(true)
        // Se o médico clicar em "Parar compartilhamento" no meio, seguimos
        // gravando só o microfone — com aviso visível.
        streamChamada.getAudioTracks()[0]?.addEventListener('ended', () => {
          setChamadaAtiva(false)
          setAvisoChamada(
            'O compartilhamento da chamada foi interrompido — gravando apenas o microfone.',
          )
        })
      }

      // Mixagem (mic + chamada) num único stream para o MediaRecorder; o
      // mesmo contexto alimenta o medidor de nível.
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const destino = ctx.createMediaStreamDestination()
      ctx.createMediaStreamSource(stream).connect(destino)
      if (streamChamada) {
        ctx
          .createMediaStreamSource(new MediaStream(streamChamada.getAudioTracks()))
          .connect(destino)
      }
      iniciarMedidor(ctx, [stream, ...(streamChamada ? [streamChamada] : [])])

      const recorder = new MediaRecorder(destino.stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setAudio({ blob, url: URL.createObjectURL(blob) })
        liberarStream()
        setEstado('finalizado')
        // Adianta o trabalho pesado: corta e transcreve em segundo plano
        // enquanto o médico revisa o áudio.
        iniciarPreTranscricao(blob)
      }
      recorder.start()
      recorderRef.current = recorder
      setSegundos(0)
      iniciarTimer()
      gravandoRef.current = true
      setEstado('gravando')
    } catch (e: unknown) {
      const nome = e instanceof DOMException ? e.name : ''
      if (nome === 'NotAllowedError' || nome === 'SecurityError') {
        setErro(
          'Permissão de microfone negada. Autorize o microfone para este site nas configurações do navegador e tente de novo.',
        )
      } else if (nome === 'NotFoundError' || nome === 'DevicesNotFoundError') {
        setErro('Nenhum microfone encontrado. Conecte um microfone e tente novamente.')
      } else if (nome === 'NotReadableError') {
        setErro('O microfone está em uso por outro aplicativo. Feche-o e tente novamente.')
      } else {
        setErro('Não foi possível acessar o microfone. Verifique a permissão do navegador.')
      }
    }
  }

  function pausar() {
    recorderRef.current?.pause()
    pararTimer()
    gravandoRef.current = false
    setEstado('pausado')
  }

  function marcarMomento() {
    marcasRef.current = [...marcasRef.current, segundos]
    setMarcas(marcasRef.current)
    setMarcaFeedback(true)
    setTimeout(() => setMarcaFeedback(false), 1500)
  }

  function retomar() {
    recorderRef.current?.resume()
    iniciarTimer()
    gravandoRef.current = true
    setEstado('gravando')
  }

  function finalizar() {
    pararTimer()
    gravandoRef.current = false
    recorderRef.current?.stop()
  }

  function regravar() {
    setAudio((a) => {
      if (a) URL.revokeObjectURL(a.url)
      return null
    })
    setErroEnvio(null)
    setEnvio('ocioso')
    setProgresso(null)
    setSegundos(0)
    setMarcas([])
    marcasRef.current = []
    setAvisoChamada(null)
    // Invalida a pré-transcrição em andamento (workers checam a geração).
    geracaoRef.current++
    preTransRef.current = null
    setEstado('ocioso')
  }

  // Transcreve os chunks com concorrência limitada, preservando a ordem.
  // `geracao` permite cancelar workers se o médico regravar no meio.
  async function transcreverChunks(
    chunks: Blob[],
    aoProgredir: (concluidos: number) => void,
    geracao: number,
  ): Promise<string> {
    const resultados = new Array<string>(chunks.length).fill('')
    let proximo = 0
    let concluidos = 0

    // Envia um chunk com retry + backoff: protege contra falhas transitórias
    // (rede, 429, 5xx) que ficam mais prováveis ao subir a concorrência.
    async function enviarChunk(i: number, chunk: Blob): Promise<string> {
      let ultimoErro = 'desconhecido'
      for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_CHUNK; tentativa++) {
        try {
          const form = new FormData()
          form.append('audio', chunk, `chunk-${i}.wav`)
          const resp = await fetch(`/api/consultas/${consultaId}/transcrever-chunk`, {
            method: 'POST',
            body: form,
          })
          const dados = (await resp.json().catch(() => null)) as
            | { ok: true; texto: string }
            | { ok: false; erro: string }
            | null
          if (resp.ok && dados && dados.ok !== false) {
            return dados.texto ?? ''
          }
          ultimoErro = (dados && 'erro' in dados && dados.erro) || `HTTP ${resp.status}`
        } catch (e) {
          ultimoErro = e instanceof Error ? e.message : 'falha de rede'
        }
        if (tentativa < MAX_TENTATIVAS_CHUNK) {
          await new Promise((r) => setTimeout(r, 800 * tentativa))
        }
      }
      throw new Error(`Falha ao transcrever um trecho (${MAX_TENTATIVAS_CHUNK}x): ${ultimoErro}`)
    }

    async function worker() {
      for (;;) {
        if (geracaoRef.current !== geracao) return // regravou: para de gastar API
        const i = proximo++
        const chunk = chunks[i]
        if (i >= chunks.length || !chunk) return
        resultados[i] = await enviarChunk(i, chunk)
        concluidos++
        aoProgredir(concluidos)
      }
    }

    const trabalhadores = Math.min(CONCORRENCIA_CHUNKS, chunks.length)
    await Promise.all(Array.from({ length: trabalhadores }, () => worker()))

    if (geracaoRef.current !== geracao) throw new Error('Gravação descartada.')

    // Insere as marcas de "momento importante" perto do trecho correspondente
    // (precisão de ~90s, o tamanho do chunk) — vira dica textual para a IA.
    const partes = resultados.map((texto, i) => {
      const marcasDoChunk = marcasRef.current.filter(
        (m) => Math.floor(m / SEGUNDOS_POR_CHUNK) === i,
      )
      const aviso = marcasDoChunk.length
        ? `[Momento importante marcado pelo médico por volta de ${marcasDoChunk
            .map(formatarTempo)
            .join(', ')}] `
        : ''
      return aviso + texto
    })
    return partes.join(' ').replace(/\s+/g, ' ').trim()
  }

  /** Corta e transcreve o áudio, reportando progresso. */
  async function executarTranscricao(blob: Blob, geracao: number): Promise<string> {
    setProgresso({ fase: 'cortando', atual: 0, total: 0 })
    // 1) Corta o áudio em chunks WAV curtos (no navegador, sem subir o áudio inteiro).
    const chunks = await audioParaChunksWav(blob)
    // 2) Transcreve cada chunk (chamadas curtas, cabem no limite serverless).
    setProgresso({ fase: 'transcrevendo', atual: 0, total: chunks.length })
    return transcreverChunks(
      chunks,
      (concluidos) =>
        setProgresso({ fase: 'transcrevendo', atual: concluidos, total: chunks.length }),
      geracao,
    )
  }

  /** Dispara a transcrição em segundo plano assim que a gravação termina. */
  function iniciarPreTranscricao(blob: Blob) {
    const geracao = ++geracaoRef.current
    const promessa = executarTranscricao(blob, geracao)
    // Evita unhandled rejection; o erro reaparece no await de gerarProntuario.
    promessa.catch(() => undefined)
    preTransRef.current = { geracao, promessa }
  }

  async function gerarProntuario() {
    if (!audio) return
    setEnvio('enviando')
    setErroEnvio(null)
    try {
      // Usa a pré-transcrição iniciada ao finalizar; se falhou/não existe, refaz.
      let transcricao: string
      try {
        const pre = preTransRef.current
        if (pre && pre.geracao === geracaoRef.current) {
          transcricao = await pre.promessa
        } else {
          transcricao = await executarTranscricao(audio.blob, geracaoRef.current)
        }
      } catch {
        transcricao = await executarTranscricao(audio.blob, geracaoRef.current)
      }
      if (!transcricao) {
        setErroEnvio('Não foi possível captar fala no áudio. Tente regravar.')
        setEnvio('erro')
        return
      }

      // 3) Estrutura o SOAP a partir da transcrição completa (uma chamada ao Claude).
      setProgresso({ fase: 'estruturando', atual: 0, total: 0 })
      const resp = await fetch(`/api/consultas/${consultaId}/estruturar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcricao }),
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

      URL.revokeObjectURL(audio.url)
      router.replace(`/consultas/${consultaId}`)
    } catch (e: unknown) {
      setErroEnvio(
        e instanceof Error && e.message
          ? e.message
          : 'Falha ao processar o áudio. Verifique a rede e tente novamente.',
      )
      setEnvio('erro')
    }
  }

  if (estado === 'finalizado' && audio) {
    if (envio === 'enviando') {
      const rotulo =
        progresso?.fase === 'transcrevendo'
          ? `Transcrevendo… (${progresso.atual}/${progresso.total} trechos)`
          : progresso?.fase === 'estruturando'
            ? 'Estruturando a evolução (SOAP, corrida e UBS)…'
            : 'Preparando o áudio…'
      const pct =
        progresso?.fase === 'transcrevendo' && progresso.total > 0
          ? Math.round((progresso.atual / progresso.total) * 100)
          : null
      return (
        <div className="space-y-5 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium">Gerando prontuário…</p>
            <p className="text-sm text-muted-foreground">{rotulo}</p>
          </div>
          {pct !== null ? (
            <div className="mx-auto h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Consultas longas levam mais tempo. Não feche esta aba.
          </p>
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

        {estado === 'gravando' || estado === 'pausado' ? (
          <div className="w-full max-w-xs space-y-1.5">
            {/* Medidor de som: confirma que ESTÁ captando (mic + chamada). */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-[width] duration-200"
                style={{ width: `${nivelAudio}%` }}
              />
            </div>
            {chamadaAtiva ? (
              <p className="text-xs text-primary">
                <MonitorSpeaker className="mr-1 inline h-3 w-3" />
                Capturando também o áudio da chamada
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {avisoSilencio && estado === 'gravando' ? (
        <p
          role="alert"
          className="mx-auto max-w-sm rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
        >
          ⚠️ Nenhum som captado há mais de 10 segundos. Verifique o microfone
          {modoChamada ? ' e o compartilhamento de áudio da chamada' : ''} antes de continuar.
        </p>
      ) : null}

      {avisoChamada ? (
        <p role="alert" className="mx-auto max-w-sm text-sm text-destructive">
          {avisoChamada}
        </p>
      ) : null}

      {erro ? (
        <p role="alert" className="mx-auto max-w-sm text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      {estado === 'ocioso' ? (
        <label className="mx-auto flex max-w-sm cursor-pointer items-start gap-3 rounded-lg border border-input bg-muted/40 p-3.5 text-left">
          <input
            type="checkbox"
            checked={modoChamada}
            onChange={(e) => setModoChamada(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-primary"
          />
          <span className="text-sm">
            <span className="font-medium">
              <MonitorSpeaker className="mr-1 inline h-4 w-4 text-primary" />
              Teleconsulta — capturar o áudio da chamada
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Ao iniciar, escolha a <strong>aba</strong> da chamada (WhatsApp Web, Meet…) e marque
              “Compartilhar áudio da guia”. Sem isso, a voz do paciente não entra na gravação.
            </span>
          </span>
        </label>
      ) : null}

      {marcas.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          <Flag className="mr-1 inline h-3 w-3" />
          {marcas.length === 1
            ? `1 momento marcado (${formatarTempo(marcas[0] ?? 0)})`
            : `${marcas.length} momentos marcados (${marcas.map(formatarTempo).join(', ')})`}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-center gap-3">
        {estado === 'ocioso' ? (
          <Button size="lg" onClick={iniciar}>
            <Mic className="h-4 w-4" />
            Iniciar gravação
          </Button>
        ) : null}

        {estado === 'gravando' ? (
          <>
            <Button size="lg" variant="outline" onClick={pausar}>
              <Pause className="h-4 w-4" />
              Pausar
            </Button>
            <Button size="lg" variant="outline" onClick={marcarMomento}>
              <Flag className={marcaFeedback ? 'h-4 w-4 text-primary' : 'h-4 w-4'} />
              {marcaFeedback ? 'Marcado!' : 'Marcar momento'}
            </Button>
          </>
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
