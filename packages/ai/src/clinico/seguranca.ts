/**
 * Clinical Safety Engine — verificações DETERMINÍSTICAS de segurança sobre
 * as prescrições sugeridas, cruzando com os dados cadastrais do paciente.
 *
 * Regras (do spec):
 * - Nunca afirmar que interações foram descartadas quando a lista de
 *   medicamentos é desconhecida — isso vira um alerta explícito.
 * - Não substitui avaliação médica: alertas apontam motivo e origem do dado.
 * - Sem chamadas de IA aqui: só cruzamento verificável (testável).
 */

export type TipoAlertaSeguranca =
  | 'ALERGIA'
  | 'DUPLICIDADE'
  | 'LISTA_MEDICAMENTOS_DESCONHECIDA'
  | 'ALERGIAS_DESCONHECIDAS'

export interface AlertaSeguranca {
  tipo: TipoAlertaSeguranca
  gravidade: 'CRITICO' | 'ATENCAO'
  mensagem: string
  /** De onde veio o dado que gerou o alerta (auditabilidade). */
  origem: string
}

export interface EntradaSeguranca {
  /** Alergias conhecidas (cadastro do paciente e/ou relatadas na consulta). */
  alergias: string[]
  /** Medicamentos em uso conhecidos; null = lista NÃO informada. */
  medicamentosEmUso: string[] | null
  /** Prescrições sugeridas (texto livre por item). */
  prescricoes: string[]
}

/** Normaliza para comparação: minúsculas, sem acento, sem pontuação. */
function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Primeiro token "forte" de um item (nome do fármaco, ignora dose/via). */
function tokensFortes(item: string): string[] {
  return normalizar(item)
    .split(' ')
    .filter((t) => t.length >= 5 && !/^\d/.test(t))
}

export function verificarSegurancaClinica(entrada: EntradaSeguranca): AlertaSeguranca[] {
  const alertas: AlertaSeguranca[] = []
  const prescricoes = entrada.prescricoes.filter((p) => p.trim())
  if (prescricoes.length === 0) return alertas

  // 1) Alergia × prescrição (match por termo normalizado).
  for (const alergia of entrada.alergias) {
    const termos = tokensFortes(alergia)
    if (termos.length === 0) continue
    for (const presc of prescricoes) {
      const prescNorm = normalizar(presc)
      const termoBatido = termos.find((t) => prescNorm.includes(t))
      if (termoBatido) {
        alertas.push({
          tipo: 'ALERGIA',
          gravidade: 'CRITICO',
          mensagem: `Possível conflito com alergia registrada ("${alergia}") na prescrição sugerida "${presc}". Confirme antes de prescrever.`,
          origem: 'Cadastro/relato de alergias × prescrição sugerida',
        })
        break
      }
    }
  }

  // 2) Duplicidade: mesmo fármaco em uso e na prescrição sugerida.
  if (entrada.medicamentosEmUso && entrada.medicamentosEmUso.length > 0) {
    for (const emUso of entrada.medicamentosEmUso) {
      const termos = tokensFortes(emUso)
      if (termos.length === 0) continue
      for (const presc of prescricoes) {
        const prescNorm = normalizar(presc)
        if (termos.some((t) => prescNorm.includes(t))) {
          alertas.push({
            tipo: 'DUPLICIDADE',
            gravidade: 'ATENCAO',
            mensagem: `"${emUso}" já consta como medicamento em uso e aparece na prescrição sugerida ("${presc}"). Verifique duplicidade/ajuste de dose.`,
            origem: 'Medicamentos em uso × prescrição sugerida',
          })
          break
        }
      }
    }
  }

  // 3) Lacunas que IMPEDEM descartar risco (regra do spec: nunca silenciar).
  if (entrada.medicamentosEmUso === null || entrada.medicamentosEmUso.length === 0) {
    alertas.push({
      tipo: 'LISTA_MEDICAMENTOS_DESCONHECIDA',
      gravidade: 'ATENCAO',
      mensagem:
        'A lista de medicamentos em uso não está registrada — interações medicamentosas NÃO podem ser descartadas. Confirme com o paciente antes de prescrever.',
      origem: 'Ausência de lista de medicamentos',
    })
  }
  if (entrada.alergias.length === 0) {
    alertas.push({
      tipo: 'ALERGIAS_DESCONHECIDAS',
      gravidade: 'ATENCAO',
      mensagem: 'Não há registro de alergias (nem "nega alergias") — confirme antes de prescrever.',
      origem: 'Ausência de registro de alergias',
    })
  }

  return alertas
}
