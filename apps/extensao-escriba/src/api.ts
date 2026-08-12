import { API_BASE_PADRAO } from './config'
import type { ResultadoConsulta } from './tipos'

/**
 * Cliente da API do Escriba. Roda em contextos da extensão (background e
 * offscreen) — com `host_permissions` o fetch não sofre CORS. Auth por
 * Bearer token colado uma única vez no popup (chrome.storage.local).
 */

export async function lerToken(): Promise<string | null> {
  const { token } = await chrome.storage.local.get('token')
  return typeof token === 'string' && token ? token : null
}

export async function lerApiBase(): Promise<string> {
  const { apiBase } = await chrome.storage.local.get('apiBase')
  return typeof apiBase === 'string' && apiBase ? apiBase : API_BASE_PADRAO
}

async function requisicao<T>(caminho: string, init?: RequestInit): Promise<T> {
  const [token, base] = await Promise.all([lerToken(), lerApiBase()])
  if (!token) throw new Error('Extensão não conectada. Abra o popup e cole o token.')

  const resp = await fetch(`${base}${caminho}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
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
  consultaId: string,
  chunk: Blob,
  i: number,
): Promise<string> {
  const form = new FormData()
  form.append('audio', chunk, `chunk-${i}.wav`)
  const r = await requisicao<{ texto: string }>(`/api/consultas/${consultaId}/transcrever-chunk`, {
    method: 'POST',
    body: form,
  })
  return r.texto ?? ''
}

export async function estruturar(consultaId: string, transcricao: string): Promise<void> {
  await requisicao(`/api/consultas/${consultaId}/estruturar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcricao }),
  })
}
