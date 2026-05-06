import { router, procedurePublica } from '../trpc'

export const bancaRouter = router({
  listar: procedurePublica.query(async ({ ctx }) => {
    return ctx.prisma.banca.findMany({
      orderBy: [{ prioridade: 'desc' }, { nome: 'asc' }],
      select: {
        id: true,
        codigo: true,
        nome: true,
        estado: true,
        cor: true,
      },
    })
  }),
})
