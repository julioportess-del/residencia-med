import type { EtapaProcesso } from '@residencia-med/core'

type VarianteBadge = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'

export const ETAPAS: Record<EtapaProcesso, { rotulo: string; variante: VarianteBadge }> = {
  AGUARDANDO_EDITAL: { rotulo: 'Aguardando edital', variante: 'outline' },
  EDITAL_PUBLICADO: { rotulo: 'Edital publicado', variante: 'secondary' },
  INSCRICOES_EM_BREVE: { rotulo: 'Inscrições em breve', variante: 'secondary' },
  INSCRICOES_ABERTAS: { rotulo: 'Inscrições abertas', variante: 'warning' },
  INSCRICOES_ENCERRADAS: { rotulo: 'Inscrições encerradas', variante: 'outline' },
  INSCRITO: { rotulo: 'Inscrito', variante: 'default' },
  PROVA_HOJE: { rotulo: 'Prova hoje', variante: 'destructive' },
  PROVA_PASSOU: { rotulo: 'Prova passou', variante: 'secondary' },
  REALIZADA: { rotulo: 'Realizada', variante: 'success' },
}

const formatoDia = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Formata data de calendário "YYYY-MM-DD" (sem deslocar fuso). */
export function formatarDia(chave: string | null): string {
  if (!chave) return '—'
  return formatoDia.format(new Date(`${chave}T00:00:00Z`)).replace('.', '')
}

export function textoDias(dias: number): string {
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'amanhã'
  return `em ${dias} dias`
}
