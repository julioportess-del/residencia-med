import { prismaClinico } from '@residencia-med/db-clinico'

export interface PreferenciasMedico {
  especialidade: string
  instrucoesCustom: string
  formatoPadrao: 'SOAP' | 'CORRIDA' | 'UBS'
}

const PADRAO: PreferenciasMedico = {
  especialidade: '',
  instrucoesCustom: '',
  formatoPadrao: 'SOAP',
}

/**
 * Carrega as preferencias do medico (ou padroes se ainda nao definiu).
 * Multi-tenant por `usuarioAuthId`. Sem dado de paciente.
 */
export async function obterPreferencias(usuarioAuthId: string): Promise<PreferenciasMedico> {
  const pref = await prismaClinico.preferenciasMedico.findUnique({
    where: { usuarioAuthId },
  })
  if (!pref) return PADRAO
  return {
    especialidade: pref.especialidade ?? '',
    instrucoesCustom: pref.instrucoesCustom ?? '',
    formatoPadrao: pref.formatoPadrao as PreferenciasMedico['formatoPadrao'],
  }
}
