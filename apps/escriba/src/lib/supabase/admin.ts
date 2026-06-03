import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { BUCKET_ANEXOS } from '@/lib/anexos-tipos'

// Cliente Supabase com SERVICE ROLE — uso EXCLUSIVO no servidor (Route Handlers).
// NUNCA importar em componente cliente: a service key dá acesso total ao projeto.
// Protecao: SUPABASE_SERVICE_ROLE_KEY nao tem prefixo NEXT_PUBLIC, entao nunca
// e enviada ao bundle do cliente (ficaria undefined la).

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

export class StorageIndisponivelError extends Error {
  constructor() {
    super('Storage não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
    this.name = 'StorageIndisponivelError'
  }
}

let _admin: SupabaseClient | null = null

function admin(): SupabaseClient {
  if (!URL || !SERVICE_ROLE || URL.includes('placeholder')) {
    throw new StorageIndisponivelError()
  }
  if (!_admin) {
    _admin = createClient(URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return _admin
}

/** Remove caracteres perigosos do nome para compor um path de storage seguro. */
export function sanitizarNomeArquivo(nome: string): string {
  const limpo = nome
    .normalize('NFKD')
    .replace(/[^\w.\- ]+/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 120)
  return limpo || 'arquivo'
}

/** Caminho isolado por médico: {usuarioAuthId}/{anexoId}/{nome}. */
export function caminhoAnexo(usuarioAuthId: string, anexoId: string, nomeArquivo: string): string {
  return `${usuarioAuthId}/${anexoId}/${sanitizarNomeArquivo(nomeArquivo)}`
}

/** Gera URL/token de upload assinado para o navegador subir o arquivo direto ao bucket. */
export async function criarUploadAssinado(path: string): Promise<{ path: string; token: string }> {
  const { data, error } = await admin().storage.from(BUCKET_ANEXOS).createSignedUploadUrl(path)
  if (error || !data) throw new Error(error?.message ?? 'Falha ao gerar upload assinado.')
  return { path: data.path, token: data.token }
}

/** Baixa os bytes de um objeto do bucket (uso server-side para enviar ao Claude). */
export async function baixarBytes(path: string): Promise<Buffer> {
  const { data, error } = await admin().storage.from(BUCKET_ANEXOS).download(path)
  if (error || !data) throw new Error(error?.message ?? 'Falha ao baixar o anexo.')
  return Buffer.from(await data.arrayBuffer())
}

/** Hard-delete de objetos do bucket (retenção/LGPD). */
export async function removerObjetos(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  const { error } = await admin().storage.from(BUCKET_ANEXOS).remove(paths)
  if (error) throw new Error(error.message)
}
