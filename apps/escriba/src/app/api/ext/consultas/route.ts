import { z } from 'zod'
import { prismaClinico } from '@residencia-med/db-clinico'
import { usuarioDoBearer } from '@/lib/auth-extensao'
import { TIPO_ATENDIMENTO_VALORES } from '@/lib/validacao'

export const dynamic = 'force-dynamic'

const corpoSchema = z.object({
  pacienteNome: z
    .string()
    .trim()
    .min(2, 'Informe o nome (ou iniciais) do paciente.')
    .max(120)
    .regex(/^[\p{L}.\s'-]+$/u, 'Use apenas letras (sem números).'),
  tipoAtendimento: z.enum(TIPO_ATENDIMENTO_VALORES).optional().default('OUTRO'),
  // LGPD: o widget exige a confirmação antes de gravar, como no app.
  consentimentoConfirmado: z.literal(true),
  origem: z.literal('FEEGOW').optional(),
})

/**
 * Cria uma consulta a partir da extensão Chrome (widget no Feegow).
 * Mesmo modelo da criação web: status GRAVANDO, consentimento obrigatório,
 * auditoria em LogAcesso. A gravação/chunks usam as rotas já existentes.
 */
export async function POST(req: Request) {
  const user = await usuarioDoBearer(req)
  if (!user) {
    return Response.json({ ok: false, erro: 'Token inválido ou revogado.' }, { status: 401 })
  }

  const corpo = corpoSchema.safeParse(await req.json().catch(() => null))
  if (!corpo.success) {
    const msg = corpo.error.issues[0]?.message ?? 'Dados inválidos.'
    return Response.json({ ok: false, erro: msg }, { status: 400 })
  }

  const consulta = await prismaClinico.consulta.create({
    data: {
      usuarioAuthId: user.id,
      pacienteIniciais: corpo.data.pacienteNome,
      tipoAtendimento: corpo.data.tipoAtendimento,
      consentimentoConfirmado: true,
      consentimentoEm: new Date(),
    },
    select: { id: true },
  })

  await prismaClinico.logAcesso.create({
    data: {
      usuarioAuthId: user.id,
      acao: 'CRIAR_CONSULTA_EXTENSAO',
      consultaId: consulta.id,
    },
  })

  return Response.json({ ok: true, id: consulta.id })
}
