import { NextResponse } from 'next/server'
import { z } from 'zod'
import { mentorStream } from '@residencia-med/ai'
import { checarLimiteIA } from '@residencia-med/billing'
import { prisma } from '@residencia-med/db'
import { supabaseUserAtual } from '@/lib/supabase/server'
import { garantirUser } from '@/server/trpc'
import { rateLimit } from '@/lib/rate-limit'
import { montarContextoUsuario } from '@/server/routers/mentor'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const InputSchema = z.object({
  conversaId: z.string().cuid(),
  mensagem: z.string().min(1).max(4000),
})

export async function POST(req: Request) {
  const { user: authUser } = await supabaseUserAtual()
  if (!authUser?.email) return new NextResponse('Unauthorized', { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = InputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Entrada inválida', details: parsed.error.flatten() }, { status: 400 })
  }

  const user = await garantirUser(authUser.id, authUser.email)

  // Mentor consome cota de IA — usa o mesmo limite de explicações
  const limite = await checarLimiteIA(user.id)
  if (!limite.permitido) {
    return NextResponse.json({ error: limite.motivo ?? 'Limite de IA atingido' }, { status: 403 })
  }

  const rl = await rateLimit({ chave: `mentor:${user.id}`, limite: 20, janelaSegundos: 60 })
  if (!rl.permitido) {
    return NextResponse.json({ error: 'Muitas mensagens em sequência. Aguarde alguns segundos.' }, { status: 429 })
  }

  const conversa = await prisma.conversaMentor.findFirst({
    where: { id: parsed.data.conversaId, userId: user.id },
    include: {
      mensagens: { orderBy: { createdAt: 'asc' }, take: 30 },
    },
  })
  if (!conversa) return new NextResponse('Conversa não encontrada', { status: 404 })

  // Persiste a mensagem do usuário antes de iniciar o stream
  await prisma.mensagemMentor.create({
    data: {
      conversaId: conversa.id,
      papel: 'USUARIO',
      conteudo: parsed.data.mensagem,
    },
  })

  const contexto = await montarContextoUsuario(prisma, user.id)
  const historico = conversa.mensagens
    .filter((m) => m.papel === 'USUARIO' || m.papel === 'ASSISTENTE')
    .map((m) => ({
      papel: m.papel as 'USUARIO' | 'ASSISTENTE',
      conteudo: m.conteudo,
    }))

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const gen = mentorStream(
          {
            contexto,
            historico,
            novaPergunta: parsed.data.mensagem,
            userId: user.id,
            conversaId: conversa.id,
          },
          async (resultado) => {
            // Persiste resposta + usage no fim
            await prisma.mensagemMentor.create({
              data: {
                conversaId: conversa.id,
                papel: 'ASSISTENTE',
                conteudo: resultado.respostaCompleta,
                inputTokens: resultado.inputTokens,
                outputTokens: resultado.outputTokens,
                custoUsd: resultado.custoUsd,
              },
            })
            await prisma.conversaMentor.update({
              where: { id: conversa.id },
              data: { updatedAt: new Date() },
            })
            // Se ainda for o título padrão, deriva título da primeira pergunta
            if (conversa.titulo === 'Nova conversa') {
              const titulo = parsed.data.mensagem.slice(0, 60).replace(/\s+/g, ' ').trim()
              if (titulo.length > 0) {
                await prisma.conversaMentor.update({
                  where: { id: conversa.id },
                  data: { titulo },
                })
              }
            }
          },
        )
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
