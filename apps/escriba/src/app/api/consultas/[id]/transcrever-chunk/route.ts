import { NextResponse } from 'next/server'
import { prismaClinico } from '@residencia-med/db-clinico'
import { transcreverAudio, TranscricaoVaziaError } from '@residencia-med/ai/clinico'
import { usuarioAtual } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
// Cada chunk é curto (~90 s de áudio) → transcrição rápida, dentro do limite Hobby.
export const maxDuration = 60

const TAMANHO_MAXIMO_BYTES = 25 * 1024 * 1024

type Contexto = { params: Promise<{ id: string }> }

function erroJson(mensagem: string, status: number) {
  return NextResponse.json({ ok: false, erro: mensagem }, { status })
}

/**
 * Transcreve UM trecho (chunk) de áudio. O navegador corta o áudio completo em
 * vários chunks e chama este endpoint para cada um — assim consultas de qualquer
 * duração cabem no limite de tempo/tamanho da função serverless (plano grátis).
 * Áudio nunca persistido (LGPD): vive só em memória durante a transcrição.
 */
export async function POST(req: Request, { params }: Contexto) {
  const { id } = await params

  const { user } = await usuarioAtual()
  if (!user) return erroJson('Não autenticado.', 401)

  // Multi-tenant: só a consulta do próprio médico, ainda em gravação.
  const consulta = await prismaClinico.consulta.findFirst({
    where: { id, usuarioAuthId: user.id, excluidoEm: null },
    select: { id: true, status: true },
  })
  if (!consulta) return erroJson('Consulta não encontrada.', 404)
  if (consulta.status === 'REVISADO') {
    return erroJson('Esta consulta já foi finalizada.', 409)
  }

  const form = await req.formData()
  const arquivo = form.get('audio')
  if (!(arquivo instanceof File)) return erroJson('Áudio ausente no envio.', 400)
  if (arquivo.size === 0) return erroJson('Trecho de áudio vazio.', 400)
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return erroJson('Trecho de áudio grande demais.', 413)
  }

  const bytes = Buffer.from(await arquivo.arrayBuffer())

  try {
    const texto = await transcreverAudio(bytes, arquivo.name || 'chunk.wav')
    return NextResponse.json({ ok: true, texto })
  } catch (erro: unknown) {
    console.error(
      '[transcrever-chunk] falha:',
      erro instanceof Error ? `${erro.name}: ${erro.message}` : String(erro),
    )
    if (erro instanceof TranscricaoVaziaError) {
      // Trecho sem fala (silêncio) — devolve vazio, não é erro fatal.
      return NextResponse.json({ ok: true, texto: '' })
    }
    const mensagem =
      erro instanceof Error && erro.name === 'IAIndisponivelError'
        ? erro.message
        : 'Falha ao transcrever um trecho. Tente novamente.'
    return erroJson(mensagem, 500)
  }
}
