import { OnboardingInput } from '@residencia-med/types'
import { router, procedureProtegida } from '../trpc'
import { enqueueGerarPlano, enqueueRecomputarIncidencia } from '../../lib/queues'

export const onboardingRouter = router({
  status: procedureProtegida.query(async ({ ctx }) => {
    const u = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        bancasAlvo: true,
        dataProva: true,
        cargaHorariaSemanal: true,
        metaResidencia: true,
      },
    })
    return {
      completo: Boolean(
        u && u.bancasAlvo.length > 0 && u.dataProva && u.cargaHorariaSemanal && u.metaResidencia,
      ),
      dados: u,
    }
  }),

  completar: procedureProtegida.input(OnboardingInput).mutation(async ({ ctx, input }) => {
    const bancas = await ctx.prisma.banca.findMany({
      where: { id: { in: input.bancasAlvo } },
      select: { id: true, codigo: true },
    })
    const principal = bancas[0]
    if (!principal) {
      throw new Error('Selecione ao menos uma banca valida')
    }

    await ctx.prisma.user.update({
      where: { id: ctx.userId },
      data: {
        bancasAlvo: bancas.map((b) => b.codigo),
        metaResidencia: principal.codigo,
        dataProva: input.dataProva,
        cargaHorariaSemanal: input.cargaHorariaSemanal,
      },
    })

    // Garantir analise de incidencia das bancas selecionadas (idempotente).
    for (const banca of bancas) {
      await enqueueRecomputarIncidencia({ bancaId: banca.id })
    }

    await enqueueGerarPlano({ userId: ctx.userId, motivo: 'onboarding' })

    return { ok: true }
  }),
})
