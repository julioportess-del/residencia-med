import { prismaClinico } from '@residencia-med/db-clinico'
import { estruturaClinicaSchema } from '@residencia-med/ai/clinico'
import { usuarioDoBearer } from '@/lib/auth-extensao'
import { montarSecoesTexto } from '@/lib/secoes'

export const dynamic = 'force-dynamic'

interface Contexto {
  params: Promise<{ id: string }>
}

/**
 * Estado da consulta para o widget da extensão: status do pipeline e, quando
 * pronto, o prontuário completo (SOAP editado/gerado) + seções copiáveis.
 * A revisão médica acontece no widget ANTES de qualquer inserção no EHR.
 */
export async function GET(req: Request, { params }: Contexto) {
  const user = await usuarioDoBearer(req)
  if (!user) {
    return Response.json({ ok: false, erro: 'Token inválido ou revogado.' }, { status: 401 })
  }

  const { id } = await params
  const consulta = await prismaClinico.consulta.findFirst({
    where: { id, usuarioAuthId: user.id, excluidoEm: null },
    select: {
      id: true,
      status: true,
      pacienteIniciais: true,
      evolucoes: {
        select: { modelo: true, textoGerado: true, textoEditado: true, dadosEstruturados: true },
      },
      transcricao: { select: { texto: true } },
    },
  })
  if (!consulta) {
    return Response.json({ ok: false, erro: 'Consulta não encontrada.' }, { status: 404 })
  }

  const soap = consulta.evolucoes.find((e) => e.modelo === 'SOAP')
  const prontuario = soap ? (soap.textoEditado ?? soap.textoGerado) : null

  const estruturaParse = estruturaClinicaSchema.safeParse(
    consulta.evolucoes.find((e) => e.dadosEstruturados)?.dadosEstruturados,
  )
  const secoes = estruturaParse.success ? montarSecoesTexto(estruturaParse.data) : []

  return Response.json({
    ok: true,
    id: consulta.id,
    status: consulta.status,
    paciente: consulta.pacienteIniciais,
    prontuario,
    transcricao: consulta.transcricao?.texto ?? null,
    secoes,
  })
}
