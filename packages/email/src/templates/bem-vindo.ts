import { botao, envelope } from './_layout'

export function templateBemVindo({ nome }: { nome: string | null }): string {
  const saudacao = nome ? `Olá, ${nome}` : 'Olá'
  return envelope(`
    <h1 style="margin:0 0 12px;font-size:22px;">${saudacao}!</h1>
    <p>Sua conta no <strong>Residência Med</strong> está pronta. Em 4 passos rápidos a gente já gera seu plano de estudo personalizado:</p>
    <ol style="padding-left:20px;line-height:1.8;">
      <li>Escolher banca-alvo</li>
      <li>Definir data da prova</li>
      <li>Carga horária semanal</li>
      <li>Confirmar e começar</li>
    </ol>
    ${botao('https://residencia-med.vercel.app/onboarding', 'Completar onboarding')}
    <p style="color:#64748b;font-size:13px;">Qualquer dúvida, é só responder este email.</p>
  `)
}
