import { createHash } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import { QUESTOES } from './questoes-data'

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()
}

function hashQuestao(enunciado: string, vignette?: string): string {
  return createHash('sha256')
    .update(normalizar((vignette ?? '') + enunciado))
    .digest('hex')
}

export async function seedQuestoes(prisma: PrismaClient) {
  for (const q of QUESTOES) {
    const banca = await prisma.banca.findUnique({ where: { codigo: q.bancaCodigo } })
    if (!banca) {
      console.warn(`Banca nao encontrada: ${q.bancaCodigo} — pulando questao`)
      continue
    }

    const prova = await prisma.prova.upsert({
      where: { bancaId_ano_tipo: { bancaId: banca.id, ano: q.ano, tipo: q.tipo ?? 'R1' } },
      create: { bancaId: banca.id, ano: q.ano, tipo: q.tipo ?? 'R1' },
      update: {},
    })

    const hash = hashQuestao(q.enunciado, q.enunciadoVignette)
    const existente = await prisma.questao.findUnique({ where: { hash } })
    if (existente) continue

    const gabarito = q.alternativas.find((a) => a.correta)
    if (!gabarito) {
      console.warn(`Questao sem gabarito: ${q.enunciado.slice(0, 50)} — pulando`)
      continue
    }

    const questao = await prisma.questao.create({
      data: {
        bancaId: banca.id,
        provaId: prova.id,
        enunciado: q.enunciado,
        enunciadoVignette: q.enunciadoVignette,
        explicacao: q.explicacaoMd,
        explicacaoMd: q.explicacaoMd,
        gabaritoLetra: gabarito.letra,
        dificuldade: q.dificuldade,
        ano: q.ano,
        numeroOriginal: q.numeroOriginal,
        hash,
        alternativas: {
          create: q.alternativas.map((a, i) => ({
            letra: a.letra,
            texto: a.texto,
            correta: a.correta ?? false,
            explicacaoErro: a.explicacaoErro,
            ordem: i,
          })),
        },
      },
    })

    for (const codigo of q.temaCodigos) {
      const tema = await prisma.tema.findUnique({ where: { codigo } })
      if (!tema) {
        console.warn(`Tema nao encontrado: ${codigo} — pulando associacao`)
        continue
      }
      await prisma.questaoTema.create({
        data: {
          questaoId: questao.id,
          temaId: tema.id,
          peso: 1.0,
          primario: true,
        },
      })
    }

    if (q.guidelineTitulos) {
      for (const titulo of q.guidelineTitulos) {
        const guideline = await prisma.guideline.findFirst({ where: { titulo } })
        if (!guideline) continue
        await prisma.questaoGuideline.create({
          data: { questaoId: questao.id, guidelineId: guideline.id },
        })
      }
    }
  }
}
