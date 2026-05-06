import { botao, envelope } from './_layout'

type Props = {
  nome: string | null
  plano: 'PRO' | 'PREMIUM' | 'FREE'
  status: 'ativada' | 'cancelada' | 'inadimplente'
}

const COPIA: Record<Props['status'], (plano: string) => string> = {
  ativada: (p) =>
    `Sua assinatura <strong>${p}</strong> está ativa. Tudo liberado: questões ilimitadas, simulados, IA e plano adaptativo.`,
  cancelada: (p) =>
    `Sua assinatura <strong>${p}</strong> foi cancelada. Você ainda tem acesso até o fim do ciclo atual; depois disso retorna ao plano Free.`,
  inadimplente: (p) =>
    `Houve um problema com o pagamento da assinatura <strong>${p}</strong>. Atualize o método de pagamento para evitar interrupção.`,
}

export function templateMudancaPlano({ nome, plano, status }: Props): string {
  const saudacao = nome ? `Olá, ${nome}` : 'Olá'
  return envelope(`
    <h1 style="margin:0 0 12px;font-size:22px;">${saudacao}!</h1>
    <p>${COPIA[status](plano)}</p>
    ${botao('https://residencia-med.vercel.app/conta', 'Gerenciar assinatura')}
    <p style="color:#64748b;font-size:13px;">Esse email é automático e foi disparado por uma mudança detectada no Stripe.</p>
  `)
}
