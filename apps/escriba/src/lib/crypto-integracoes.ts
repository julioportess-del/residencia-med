import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

/**
 * Cifra de tokens de integração (ex.: token da API Feegow) em repouso.
 * AES-256-GCM com chave em env `INTEGRACOES_CHAVE` (32 bytes em base64).
 * O token do EHR dá acesso amplo à clínica — NUNCA vai ao navegador nem
 * fica em texto puro no banco.
 *
 * Formato armazenado: base64(iv) . base64(authTag) . base64(cifrado)
 */

const ALGORITMO = 'aes-256-gcm'
const TAMANHO_IV = 12

function chave(): Buffer {
  const b64 = process.env.INTEGRACOES_CHAVE
  if (!b64) {
    throw new Error(
      'INTEGRACOES_CHAVE ausente no ambiente (32 bytes em base64). ' +
        'Gere com: openssl rand -base64 32',
    )
  }
  const k = Buffer.from(b64, 'base64')
  if (k.length !== 32) {
    throw new Error('INTEGRACOES_CHAVE inválida: precisa ter exatamente 32 bytes (base64).')
  }
  return k
}

export function cifrarToken(textoPuro: string): string {
  const iv = randomBytes(TAMANHO_IV)
  const cipher = createCipheriv(ALGORITMO, chave(), iv)
  const cifrado = Buffer.concat([cipher.update(textoPuro, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}.${tag.toString('base64')}.${cifrado.toString('base64')}`
}

export function decifrarToken(armazenado: string): string {
  const [ivB64, tagB64, dadosB64] = armazenado.split('.')
  if (!ivB64 || !tagB64 || !dadosB64) {
    throw new Error('Token cifrado em formato inválido.')
  }
  const decipher = createDecipheriv(ALGORITMO, chave(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  const claro = Buffer.concat([decipher.update(Buffer.from(dadosB64, 'base64')), decipher.final()])
  return claro.toString('utf8')
}

/** Hash sha256 (hex) — usado para armazenar tokens da extensão sem o valor. */
export function hashSha256(valor: string): string {
  return createHash('sha256').update(valor).digest('hex')
}
