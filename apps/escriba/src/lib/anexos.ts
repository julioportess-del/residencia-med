'use client'

import { supabaseBrowser } from './supabase/client'
import {
  BUCKET_ANEXOS,
  TIPOS_ACEITOS,
  TAMANHO_MAXIMO_ANEXO_BYTES,
  TAMANHO_MAXIMO_BRUTO_BYTES,
  type CategoriaAnexoTipo,
} from './anexos-tipos'

const LADO_MAXIMO_PX = 2000 // downscale: maior lado de imagem
const QUALIDADE_JPEG = 0.85

function ehHeic(file: File): boolean {
  return /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
}

/** Valida tipo e tamanho BRUTO antes de processar. Retorna mensagem de erro ou null. */
export function validarArquivo(file: File): string | null {
  const aceitoPorTipo = (TIPOS_ACEITOS as readonly string[]).includes(file.type)
  if (!aceitoPorTipo && !ehHeic(file)) {
    return `"${file.name}": formato não suportado. Use imagem (JPG/PNG/WebP/HEIC) ou PDF.`
  }
  if (file.size > TAMANHO_MAXIMO_BRUTO_BYTES) {
    return `"${file.name}": arquivo muito grande (máx. 40 MB).`
  }
  return null
}

/** Reduz a resolução de imagens grandes e normaliza para JPEG (menor que PNG/HEIC). */
async function downscaleImagem(blob: Blob): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(blob)
  } catch {
    return blob // formato que o canvas não decodifica — envia como está
  }
  const maiorLado = Math.max(bitmap.width, bitmap.height)
  const escala = maiorLado > LADO_MAXIMO_PX ? LADO_MAXIMO_PX / maiorLado : 1
  const largura = Math.round(bitmap.width * escala)
  const altura = Math.round(bitmap.height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return blob
  }
  ctx.drawImage(bitmap, 0, 0, largura, altura)
  bitmap.close()

  const reduzido = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALIDADE_JPEG),
  )
  // Só usa o reduzido se realmente ficou menor.
  return reduzido && reduzido.size < blob.size ? reduzido : blob
}

interface ArquivoPreparado {
  blob: Blob
  nome: string
  tipoMime: string
}

/** Converte HEIC→JPEG e faz downscale de imagens grandes (tudo no navegador). */
async function prepararArquivo(file: File): Promise<ArquivoPreparado> {
  let blob: Blob = file
  let nome = file.name
  let tipoMime = file.type || 'application/octet-stream'

  if (ehHeic(file)) {
    const heic2any = (await import('heic2any')).default
    const convertido = (await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: QUALIDADE_JPEG,
    })) as Blob
    blob = convertido
    tipoMime = 'image/jpeg'
    nome = nome.replace(/\.(heic|heif)$/i, '.jpg')
  }

  if (tipoMime.startsWith('image/')) {
    const reduzido = await downscaleImagem(blob)
    if (reduzido !== blob) {
      blob = reduzido
      tipoMime = 'image/jpeg'
    }
  }

  return { blob, nome, tipoMime }
}

export interface AnexoEnviado {
  anexoId: string
  nome: string
  tipoMime: string
}

/**
 * Prepara (HEIC/downscale), pede um upload assinado e sobe o arquivo DIRETO ao
 * Supabase Storage (sem passar pela função serverless — contorna o limite de 4,5MB).
 */
export async function enviarAnexo(
  file: File,
  opts: { consultaId?: string | null; categoria?: CategoriaAnexoTipo } = {},
): Promise<AnexoEnviado> {
  const { blob, nome, tipoMime } = await prepararArquivo(file)

  if (blob.size > TAMANHO_MAXIMO_ANEXO_BYTES) {
    throw new Error(`"${nome}": ainda grande após otimização (máx. 20 MB).`)
  }

  const res = await fetch('/api/anexos/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nomeArquivo: nome,
      tipoMime,
      tamanhoBytes: blob.size,
      categoria: opts.categoria ?? 'OUTRO',
      consultaId: opts.consultaId ?? null,
    }),
  })
  const dados = (await res.json().catch(() => null)) as
    | { ok: true; anexoId: string; path: string; token: string }
    | { ok: false; erro: string }
    | null
  if (!res.ok || !dados || dados.ok === false) {
    throw new Error((dados && 'erro' in dados && dados.erro) || 'Falha ao preparar o upload.')
  }

  const { error } = await supabaseBrowser()
    .storage.from(BUCKET_ANEXOS)
    .uploadToSignedUrl(dados.path, dados.token, blob, { contentType: tipoMime })
  if (error) throw new Error(`"${nome}": falha ao enviar o arquivo.`)

  return { anexoId: dados.anexoId, nome, tipoMime }
}
