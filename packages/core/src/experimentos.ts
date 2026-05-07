/**
 * Framework simples de A/B test com atribuição determinística por hash.
 *
 * Vantagens:
 * - Sem cookies — userId é a chave estável.
 * - Mesmo userId + mesma chave → sempre mesma variante (idempotente).
 * - Pesos relativos por variante.
 *
 * Doc: docs/ROADMAP.md Turno 12
 */

export type Variante = {
  nome: string
  peso: number
}

/**
 * Hash determinístico (FNV-1a 32-bit) — converte string em uint32 uniformemente
 * distribuído. Não é criptográfico, mas é suficiente para particionar usuários.
 */
export function hashString(input: string): number {
  let hash = 2166136261 // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619) // FNV prime
  }
  return hash >>> 0 // força uint32
}

/**
 * Escolhe variante para um usuário em um experimento.
 *
 * Implementação: hash(experimentoChave + ':' + userId) % 100, e cai na faixa
 * cumulativa de pesos. Garante que a mesma combinação sempre cai na mesma
 * variante (até os pesos do experimento mudarem).
 */
export function escolherVariante(
  experimentoChave: string,
  userId: string,
  variantes: Variante[],
): string {
  if (variantes.length === 0) {
    throw new Error('Experimento sem variantes')
  }
  const pesoTotal = variantes.reduce((acc, v) => acc + v.peso, 0)
  if (pesoTotal <= 0) {
    return variantes[0]!.nome
  }
  const h = hashString(`${experimentoChave}:${userId}`)
  const bucket = h % pesoTotal

  let acumulado = 0
  for (const v of variantes) {
    acumulado += v.peso
    if (bucket < acumulado) return v.nome
  }
  return variantes[variantes.length - 1]!.nome
}

/**
 * Valida estrutura de variantes vinda de JSON do banco.
 */
export function variantesValidas(input: unknown): input is Variante[] {
  if (!Array.isArray(input) || input.length === 0) return false
  return input.every(
    (v): v is Variante =>
      typeof v === 'object' &&
      v !== null &&
      typeof (v as Variante).nome === 'string' &&
      typeof (v as Variante).peso === 'number' &&
      (v as Variante).peso >= 0,
  )
}

/**
 * Calcula taxa de conversão por variante a partir de eventos brutos.
 * Retorna mapa {variante → {visitantes, conversoes, taxaPct}}.
 */
export function calcularResultados(
  atribuicoes: Array<{ variante: string; userId: string }>,
  eventos: Array<{ variante: string; userId: string; evento: string }>,
  eventoConversao: string,
): Record<string, { visitantes: number; conversoes: number; taxaPct: number }> {
  const visitantesPorVariante = new Map<string, Set<string>>()
  for (const a of atribuicoes) {
    if (!visitantesPorVariante.has(a.variante)) {
      visitantesPorVariante.set(a.variante, new Set())
    }
    visitantesPorVariante.get(a.variante)!.add(a.userId)
  }

  const conversoesPorVariante = new Map<string, Set<string>>()
  for (const e of eventos) {
    if (e.evento !== eventoConversao) continue
    if (!conversoesPorVariante.has(e.variante)) {
      conversoesPorVariante.set(e.variante, new Set())
    }
    conversoesPorVariante.get(e.variante)!.add(e.userId)
  }

  const resultado: Record<
    string,
    { visitantes: number; conversoes: number; taxaPct: number }
  > = {}
  for (const [variante, visitantes] of visitantesPorVariante) {
    const conversoes = conversoesPorVariante.get(variante)?.size ?? 0
    const taxaPct = visitantes.size > 0 ? (conversoes / visitantes.size) * 100 : 0
    resultado[variante] = {
      visitantes: visitantes.size,
      conversoes,
      taxaPct: Math.round(taxaPct * 100) / 100,
    }
  }
  return resultado
}
