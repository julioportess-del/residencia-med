import { NextResponse } from 'next/server'
import { z } from 'zod'
import { explicarErroStream } from '@residencia-med/ai'
import { checarLimiteIA } from '@residencia-med/billing'
import { prisma } from '@residencia-med/db'
import { supabaseUserAtual } from '@/lib/supabase/server'
import { garantirUser } from '@/server/trpc'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const InputSchema = z.object({
  questaoId: z.string().cuid(),
  alternativaEscolhida: z.enum(['A', 'B', 'C', 'D', 'E']),
})

export async function POST(req: Request) {
  const { user: authUser } = await supabaseUserAtual()
  if (!authUser?.email) return new NextResponse('Unauthorized', { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = InputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const user = await garantirUser(authUser.id, authUser.email)

  const limite = await checarLimiteIA(user.id)
  if (!limite.permitido) {
    return NextResponse.json({ error: limite.motivo ?? 'Limite IA atingido' }, { status: 403 })
  }

  const rl = await rateLimit({ chave: `ia-explicar:${user.id}`, limite: 10, janelaSegundos: 60 })
  if (!rl.permitido) {
    return NextResponse.json({ error: 'Muitas requisicoes, aguarde um momento.' }, { status: 429 })
  }

  const questao = await prisma.questao.findUnique({
    where: { id: parsed.data.questaoId, publicada: true },
    include: {
      alternativas: { orderBy: { ordem: 'asc' } },
      guidelines: {
        select: {
          guideline: { select: { titulo: true, fonte: true, resumo: true } },
        },
      },
    },
  })
  if (!questao) return new NextResponse('Questao nao encontrada', { status: 404 })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const gen = explicarErroStream({
          questaoId: questao.id,
          enunciado: questao.enunciado,
          vignette: questao.enunciadoVignette ?? undefined,
          alternativas: questao.alternativas.map((a) => ({ letra: a.letra, texto: a.texto })),
          gabarito: questao.gabaritoLetra,
          alternativaEscolhida: parsed.data.alternativaEscolhida,
          guidelinesContexto: questao.guidelines.map((g) => ({
            titulo: g.guideline.titulo,
            fonte: g.guideline.fonte as unknown as string,
            resumo: g.guideline.resumo,
          })),
          userId: user.id,
        })
        for await (const chunk of gen) {
          controller.enqueue(encoder.encode(chunk))
        }
        controller.close()
      } catch (e) {
        controller.enqueue(encoder.encode(`\n\n[erro: ${(e as Error).message}]`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
