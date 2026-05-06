import { botao, envelope } from './_layout'

export function templateLembreteRevisao({
  nome,
  itensVencidos,
}: {
  nome: string | null
  itensVencidos: number
}): string {
  const saudacao = nome ? `Olá, ${nome}` : 'Olá'
  const palavra = itensVencidos === 1 ? 'item' : 'itens'
  return envelope(`
    <h1 style="margin:0 0 12px;font-size:22px;">${saudacao}!</h1>
    <p>Você tem <strong>${itensVencidos} ${palavra}</strong> de revisão espaçada vencendo hoje.</p>
    <p>10 minutos agora poupam horas de retrabalho na semana que vem. Bora?</p>
    ${botao('https://residencia-med.vercel.app/revisao', 'Revisar agora')}
    <p style="color:#64748b;font-size:13px;">Você recebe esse lembrete quando o algoritmo SM-2 detecta itens críticos. Para desativar, acesse /conta.</p>
  `)
}
