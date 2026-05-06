import { botao, envelope } from './_layout'

export function templateConviteOrg({
  nomeOrg,
  papel,
  conviteUrl,
  convidadoPorNome,
}: {
  nomeOrg: string
  papel: 'ADMIN' | 'MEMBRO'
  conviteUrl: string
  convidadoPorNome: string | null
}): string {
  const remetente = convidadoPorNome ?? 'um administrador'
  const papelTexto = papel === 'ADMIN' ? 'administrador' : 'membro'
  return envelope(`
    <h1 style="margin:0 0 12px;font-size:22px;">Você foi convidado!</h1>
    <p>${remetente} quer te adicionar à equipe <strong>${nomeOrg}</strong> no Residência Med
    como <strong>${papelTexto}</strong>.</p>
    <p>Ao aceitar, você ganha acesso aos recursos premium contratados pela equipe (questões
    ilimitadas, simulados, IA, plano adaptativo) sem precisar pagar.</p>
    ${botao(conviteUrl, 'Aceitar convite')}
    <p style="color:#64748b;font-size:13px;">Esse convite expira em 7 dias. Se você não esperava
    receber, pode ignorar este email com segurança.</p>
  `)
}
