import { Resend } from 'resend'
import { templateBemVindo } from './templates/bem-vindo'
import { templateMudancaPlano } from './templates/mudanca-plano'
import { templateLembreteRevisao } from './templates/lembrete-revisao'

const FROM_PADRAO = process.env.EMAIL_FROM ?? 'Residência Med <ola@residencia-med.com>'

let cliente: Resend | null = null

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key || key.includes('placeholder')) return null
  if (!cliente) cliente = new Resend(key)
  return cliente
}

export type EmailParams = {
  para: string
  assunto: string
  html: string
  texto: string
}

/**
 * Envia email via Resend. Retorna {ok, id?} ou {ok:false, motivo}.
 * Em modo demo (sem RESEND_API_KEY), apenas loga e retorna ok=false sem erro.
 */
export async function enviarEmail(p: EmailParams): Promise<{ ok: boolean; id?: string; motivo?: string }> {
  const resend = getResend()
  if (!resend) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[email] modo demo — não enviando para ${p.para}: ${p.assunto}`)
    }
    return { ok: false, motivo: 'RESEND_API_KEY não configurada (modo demo)' }
  }
  try {
    const r = await resend.emails.send({
      from: FROM_PADRAO,
      to: p.para,
      subject: p.assunto,
      html: p.html,
      text: p.texto,
    })
    if (r.error) return { ok: false, motivo: r.error.message }
    return { ok: true, id: r.data?.id }
  } catch (e) {
    return { ok: false, motivo: (e as Error).message }
  }
}

// Helpers de alto nível: sabem o template, montam e enviam.

export async function emailBemVindo(para: string, nome: string | null) {
  const html = templateBemVindo({ nome })
  return enviarEmail({
    para,
    assunto: 'Bem-vindo ao Residência Med',
    html,
    texto: `Olá${nome ? `, ${nome}` : ''}! Sua conta no Residência Med está pronta. Complete o onboarding em https://residencia-med.vercel.app/onboarding`,
  })
}

export async function emailMudancaPlano(
  para: string,
  nome: string | null,
  plano: 'PRO' | 'PREMIUM' | 'FREE',
  status: 'ativada' | 'cancelada' | 'inadimplente',
) {
  const html = templateMudancaPlano({ nome, plano, status })
  return enviarEmail({
    para,
    assunto: `Sua assinatura ${plano} foi ${status}`,
    html,
    texto: `Olá${nome ? `, ${nome}` : ''}! Sua assinatura ${plano} foi ${status}.`,
  })
}

export async function emailLembreteRevisao(
  para: string,
  nome: string | null,
  itensVencidos: number,
) {
  const html = templateLembreteRevisao({ nome, itensVencidos })
  return enviarEmail({
    para,
    assunto: `Você tem ${itensVencidos} ${itensVencidos === 1 ? 'item' : 'itens'} para revisar hoje`,
    html,
    texto: `Olá${nome ? `, ${nome}` : ''}! Você tem ${itensVencidos} ${itensVencidos === 1 ? 'item' : 'itens'} de revisão espaçada vencendo hoje.`,
  })
}
