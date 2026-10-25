import { z } from 'zod'
import { router, procedureProtegida } from '../trpc'

const DiscZ = z.enum(['ANALISTA', 'COMUNICADOR', 'EXECUTOR', 'CONCILIADOR'])
const SocioZ = z.enum(['TAREFAS', 'PESSOAS', 'IDEIAS', 'SISTEMAS'])
const ProcrastZ = z.enum(['LEVE', 'MODERADA', 'SEVERA'])
const MemoriaZ = z.enum(['BAIXA', 'MEDIA', 'ACIMA_DA_MEDIA', 'ALTA'])

const SalvarInput = z.object({
  disc: DiscZ.nullable(),
  socioemocional: SocioZ.nullable(),
  procrastinacao: ProcrastZ.nullable(),
  memoria: MemoriaZ.nullable(),
})

export const perfilCandidatoRouter = router({
  atual: procedureProtegida.query(async ({ ctx }) => {
    const perfil = await ctx.prisma.perfilCandidato.findUnique({
      where: { userId: ctx.userId },
    })
    return perfil
  }),

  salvar: procedureProtegida.input(SalvarInput).mutation(async ({ ctx, input }) => {
    const todosPreenchidos =
      input.disc !== null &&
      input.socioemocional !== null &&
      input.procrastinacao !== null &&
      input.memoria !== null

    return ctx.prisma.perfilCandidato.upsert({
      where: { userId: ctx.userId },
      create: {
        userId: ctx.userId,
        ...input,
        concluidoEm: todosPreenchidos ? new Date() : null,
      },
      update: {
        ...input,
        concluidoEm: todosPreenchidos ? new Date() : null,
      },
    })
  }),
})
