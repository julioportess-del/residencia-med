import { API_BASE_PADRAO } from './config'
import type { ResultadoConsulta } from './tipos'

/**
 * Cliente da API do Escriba. Auth por Bearer token colado uma vez no popup.
 * IMPORTANTE: `chrome.storage` só existe no service worker/popup — o
 * offscreen document NÃO tem acesso. Por isso as funções usadas no
 * offscreen (transcreverChunk/estruturar) recebem as credenciais
 * explicitamente, repassadas pelo background na mensagem de início.
 */

export interface Credenciais {
  token: string
  base: string
}

export async function lerToken(): Promise<string | null> {
  const { token } = await chrome.storage.local.get('token')
  return typeof token === 'string' && token ? token : null
}

export async function lerApiBase(): Promise<string> {
  const { apiBase } = await chrome.storage.local.get('apiBase')
  return typeof apiBase === 'string' && apiBase ? apiBase : API_BASE_PADRAO
}

/** Lê token+base do storage (só service worker/popup). */
export async function lerCredenciais(): Promise<Credenciais | null> {
  const [token, base] = await Promise.all([lerToken(), lerApiBase()])
  return token ? { token, base } : null
}

async function requisicaoCom<T>(
  creds: Credenciais,
  caminho: string,
  init?: RequestInit,
): Promise<T> {
  const resp = await fetch(`${creds.base}${caminho}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${creds.token}`,
      ...(init?.headers ?? {}),
    },
  })
  const dados = (await resp.json().catch(() => null)) as
    | ({ ok: true } & T)
    | { ok: false; erro: string }
    | null
  if (!resp.ok || !dados || dados.ok === false) {
    const msg = (dados && 'erro' in dados && dados.erro) || `Falha na API (HTTP ${resp.status}).`
    throw new Error(msg)
  }
  return dados as T
}

async function requisicao<T>(caminho: string, init?: RequestInit): Promise<T> {
  const creds = await lerCredenciais()
  if (!creds) throw new Error('Extensão não conectada. Abra o popup e cole o token.')
  return requisicaoCom(creds, caminho, init)
}

export async function validarConexao(): Promise<{ feegow: { configurado: boolean } }> {
  return requisicao('/api/ext/eu')
}

export async function criarConsulta(
  pacienteNome: string,
  tipoAtendimento: string,
): Promise<{ id: string }> {
  return requisicao('/api/ext/consultas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pacienteNome,
      tipoAtendimento,
      consentimentoConfirmado: true,
      origem: 'FEEGOW',
    }),
  })
}

export async function buscarConsulta(id: string): Promise<ResultadoConsulta> {
  return requisicao(`/api/ext/consultas/${id}`)
}

export async function transcreverChunk(
  creds: Credenciais,
  consultaId: string,
  chunk: Blob,
  i: number,
): Promise<string> {
  const form = new FormData()
  form.append('audio', chunk, `chunk-${i}.wav`)
  const r = await requisicaoCom<{ texto: string }>(
    creds,
    `/api/consultas/${consultaId}/transcrever-chunk`,
    { method: 'POST', body: form },
  )
  return r.texto ?? ''
}

export async function estruturar(
  creds: Credenciais,
  consultaId: string,
  transcricao: string,
): Promise<void> {
  await requisicaoCom(creds, `/api/consultas/${consultaId}/estruturar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcricao }),
  })
}
