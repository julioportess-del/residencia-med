import type { PrismaClient } from '@prisma/client'

const GUIDELINES = [
  {
    fonte: 'SBC' as const,
    titulo: 'Diretriz Brasileira de Fibrilacao Atrial 2023',
    ano: 2023,
    url: 'https://abccardiol.org/fa-2023',
    resumo:
      'Recomendacoes da SBC para diagnostico, classificacao e tratamento da FA. Score CHA2DS2-VASc para anticoagulacao; HAS-BLED para risco de sangramento. ACOD preferencial em FA nao-valvar.',
    temaCodigos: ['CARDIO_ARRITMIAS_FA'],
  },
  {
    fonte: 'SBC' as const,
    titulo: 'Diretriz de IAM com Supra de ST 2023',
    ano: 2023,
    url: 'https://abccardiol.org/iamcsst-2023',
    resumo:
      'Reperfusao em ate 12h. ICP primaria preferencial se disponivel em ate 90min (porta-balao). Trombolise em ate 30min se ICP indisponivel. AAS + segundo antiplaquetario sempre.',
    temaCodigos: ['CARDIO_SCA_IAM'],
  },
  {
    fonte: 'SBP' as const,
    titulo: 'Calendario Vacinal SBP 2024',
    ano: 2024,
    url: 'https://sbp.com.br/vacinas-2024',
    resumo:
      'Calendario completo da Sociedade Brasileira de Pediatria. BCG e Hepatite B ao nascer. Rotavirus 2-4-6 meses. Trip viral aos 12 meses. Reforcos em adolescentes.',
    temaCodigos: ['PEDIA_VACINAS'],
  },
  {
    fonte: 'MS' as const,
    titulo: 'Manejo do Trabalho de Parto - Ministerio da Saude 2023',
    ano: 2023,
    url: 'https://www.gov.br/saude/parto-2023',
    resumo:
      'Conduta ativa vs expectante na fase ativa. Indicacoes de cesariana. Monitorizacao fetal. Analgesia.',
    temaCodigos: ['GO_PARTO'],
  },
  {
    fonte: 'MS' as const,
    titulo: 'Politica Nacional de Atencao Basica',
    ano: 2017,
    url: 'https://www.gov.br/saude/pnab-2017',
    resumo:
      'Estabelece a Estrategia Saude da Familia como modelo prioritario. Define equipes minimas, populacao adscrita, atributos.',
    temaCodigos: ['PSF_SUS'],
  },
] as const

export async function seedGuidelines(prisma: PrismaClient) {
  for (const g of GUIDELINES) {
    const guideline = await prisma.guideline.create({
      data: {
        fonte: g.fonte,
        titulo: g.titulo,
        ano: g.ano,
        url: g.url,
        resumo: g.resumo,
      },
    })

    for (const codigo of g.temaCodigos) {
      const tema = await prisma.tema.findUnique({ where: { codigo } })
      if (!tema) continue
      await prisma.guidelineTema.create({
        data: { guidelineId: guideline.id, temaId: tema.id },
      })
    }
  }
}
