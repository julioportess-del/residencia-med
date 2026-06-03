import { NextResponse } from 'next/server'
import { prismaClinico } from '@residencia-med/db-clinico'
import { usuarioAtual } from '@/lib/supabase/server'
import { caminhoAnexo, criarUploadAssinado, StorageIndisponivelError } from '@/lib/supabase/admin'
import {
  TIPOS_ACEITOS,
  TAMANHO_MAXIMO_ANEXO_BYTES,
  RETENCAO_ANEXO_HORAS,
  type CategoriaAnexoTipo,
} from '@/lib/anexos-tipos'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function erroJson(mensagem: string, status: number) {
  return NextResponse.json({ ok: false, erro: mensagem }, { status })
}

const CATEGORIAS: CategoriaAnexoTipo[] = ['EXAME_LAB', 'EXAME_IMAGEM', 'IMAGEM_CLINICA', 'OUTRO']

interface CorpoUpload {
  nomeArquivo?: string
  tipoMime?: string
  tamanhoBytes?: number
  categoria?: string
  consultaId?: string | null
}

export async function POST(req: Request) {
  const { user } = await usuarioAtual()
  if (!user) return erroJson('Não autenticado.', 401)

  let corpo: CorpoUpload
  try {
    corpo = (await req.json()) as CorpoUpload
  } catch {
    return erroJson('Corpo inválido.', 400)
  }

  const nomeArquivo = (corpo.nomeArquivo ?? '').trim()
  const tipoMime = (corpo.tipoMime ?? '').trim()
  const tamanhoBytes = Number(corpo.tamanhoBytes ?? 0)

  if (!nomeArquivo) return erroJson('Nome do arquivo ausente.', 400)
  if (!TIPOS_ACEITOS.includes(tipoMime as (typeof TIPOS_ACEITOS)[number])) {
    return erroJson('Formato não suportado. Envie imagem (JPG/PNG/WebP) ou PDF.', 415)
  }
  if (!Number.isFinite(tamanhoBytes) || tamanhoBytes <= 0) {
    return erroJson('Tamanho de arquivo inválido.', 400)
  }
  if (tamanhoBytes > TAMANHO_MAXIMO_ANEXO_BYTES) {
    return erroJson('Arquivo muito grande (máx. 20 MB após otimização).', 413)
  }

  const categoria: CategoriaAnexoTipo = CATEGORIAS.includes(corpo.categoria as CategoriaAnexoTipo)
    ? (corpo.categoria as CategoriaAnexoTipo)
    : 'OUTRO'

  // Vínculo opcional a uma consulta — valida posse (multi-tenant).
  const consultaId = corpo.consultaId ? String(corpo.consultaId) : null
  if (consultaId) {
    const consulta = await prismaClinico.consulta.findFirst({
      where: { id: consultaId, usuarioAuthId: user.id, excluidoEm: null },
      select: { id: true },
    })
    if (!consulta) return erroJson('Consulta não encontrada.', 404)
  }

  const expiraEm = new Date(Date.now() + RETENCAO_ANEXO_HORAS * 60 * 60 * 1000)

  try {
    // Cria a linha primeiro (id cuid) e só então compõe o path com esse id.
    const anexo = await prismaClinico.anexo.create({
      data: {
        usuarioAuthId: user.id,
        consultaId,
        nomeArquivo,
        tipoMime,
        tamanhoBytes: Math.round(tamanhoBytes),
        categoria,
        storagePath: '',
        status: 'ENVIADO',
        expiraEm,
      },
      select: { id: true },
    })

    const path = caminhoAnexo(user.id, anexo.id, nomeArquivo)
    await prismaClinico.anexo.update({ where: { id: anexo.id }, data: { storagePath: path } })

    const { token } = await criarUploadAssinado(path)
    return NextResponse.json({ ok: true, anexoId: anexo.id, path, token })
  } catch (erro: unknown) {
    if (erro instanceof StorageIndisponivelError) return erroJson(erro.message, 503)
    return erroJson('Falha ao preparar o upload. Tente novamente.', 500)
  }
}
