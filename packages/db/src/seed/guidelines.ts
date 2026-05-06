import type { PrismaClient } from '@prisma/client'

const GUIDELINES = [
  {
    fonte: 'SBC' as const,
    titulo: 'Diretriz Brasileira de Fibrilacao Atrial 2023',
    ano: 2023,
    url: 'https://abccardiol.org/fa-2023',
    resumo:
      'Recomendações da SBC para diagnóstico, classificação e tratamento da FA. Escore CHA2DS2-VASc para anticoagulação; HAS-BLED para risco de sangramento. ACOD preferencial em FA não valvar.',
    temaCodigos: ['CARDIO_ARRITMIAS_FA'],
  },
  {
    fonte: 'SBC' as const,
    titulo: 'Diretriz de IAM com Supra de ST 2023',
    ano: 2023,
    url: 'https://abccardiol.org/iamcsst-2023',
    resumo:
      'Reperfusão em até 12h. ICP primária preferencial se disponível em até 90min (porta-balão). Trombólise em até 30min se ICP indisponível. AAS + segundo antiplaquetário sempre.',
    temaCodigos: ['CARDIO_SCA_IAM'],
  },
  {
    fonte: 'SBP' as const,
    titulo: 'Calendario Vacinal SBP 2024',
    ano: 2024,
    url: 'https://sbp.com.br/vacinas-2024',
    resumo:
      'Calendário completo da Sociedade Brasileira de Pediatria. BCG e Hepatite B ao nascer. Rotavírus aos 2, 4 e 6 meses. Tríplice viral aos 12 meses. Reforços na adolescência.',
    temaCodigos: ['PEDIA_VACINAS'],
  },
  {
    fonte: 'MS' as const,
    titulo: 'Manejo do Trabalho de Parto - Ministerio da Saude 2023',
    ano: 2023,
    url: 'https://www.gov.br/saude/parto-2023',
    resumo:
      'Conduta ativa versus expectante na fase ativa. Indicações de cesariana. Monitorização fetal. Analgesia.',
    temaCodigos: ['GO_PARTO'],
  },
  {
    fonte: 'MS' as const,
    titulo: 'Politica Nacional de Atencao Basica',
    ano: 2017,
    url: 'https://www.gov.br/saude/pnab-2017',
    resumo:
      'Estabelece a Estratégia Saúde da Família como modelo prioritário. Define equipes mínimas, população adscrita e atributos da APS.',
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
