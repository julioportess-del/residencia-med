import type { PrismaClient } from '@prisma/client'

type TemaSeed = {
  codigo: string
  nome: string
  filhos?: TemaSeed[]
}

type EspecialidadeSeed = {
  codigo: string
  nome: string
  cor: string
  icone: string
  ordem: number
  temas: TemaSeed[]
}

const ESPECIALIDADES: EspecialidadeSeed[] = [
  {
    codigo: 'CARDIO',
    nome: 'Cardiologia',
    cor: '#DC2626',
    icone: 'heart-pulse',
    ordem: 1,
    temas: [
      {
        codigo: 'CARDIO_ARRITMIAS',
        nome: 'Arritmias',
        filhos: [
          { codigo: 'CARDIO_ARRITMIAS_FA', nome: 'Fibrilacao Atrial' },
          { codigo: 'CARDIO_ARRITMIAS_TV', nome: 'Taquicardia Ventricular' },
        ],
      },
      {
        codigo: 'CARDIO_SCA',
        nome: 'Sindromes Coronarianas Agudas',
        filhos: [
          { codigo: 'CARDIO_SCA_IAM', nome: 'IAM com supra' },
          { codigo: 'CARDIO_SCA_NSTEMI', nome: 'IAM sem supra / AI' },
        ],
      },
      { codigo: 'CARDIO_IC', nome: 'Insuficiencia Cardiaca' },
      { codigo: 'CARDIO_HAS', nome: 'Hipertensao Arterial' },
      { codigo: 'CARDIO_VALVAS', nome: 'Valvopatias' },
    ],
  },
  {
    codigo: 'PEDIA',
    nome: 'Pediatria',
    cor: '#F59E0B',
    icone: 'baby',
    ordem: 2,
    temas: [
      { codigo: 'PEDIA_NEO', nome: 'Neonatologia' },
      { codigo: 'PEDIA_INFECTO', nome: 'Infectologia Pediatrica' },
      { codigo: 'PEDIA_VACINAS', nome: 'Vacinacao' },
      { codigo: 'PEDIA_ALEITAMENTO', nome: 'Aleitamento e Nutricao' },
      { codigo: 'PEDIA_DESENVOLVIMENTO', nome: 'Crescimento e Desenvolvimento' },
    ],
  },
  {
    codigo: 'CLINICA',
    nome: 'Clinica Medica',
    cor: '#2563EB',
    icone: 'stethoscope',
    ordem: 3,
    temas: [
      { codigo: 'CLINICA_ENDOCRINO', nome: 'Endocrinologia' },
      { codigo: 'CLINICA_NEFRO', nome: 'Nefrologia' },
      { codigo: 'CLINICA_PNEUMO', nome: 'Pneumologia' },
      { codigo: 'CLINICA_GASTRO', nome: 'Gastroenterologia' },
      { codigo: 'CLINICA_INFECTO', nome: 'Infectologia' },
      { codigo: 'CLINICA_REUMATO', nome: 'Reumatologia' },
    ],
  },
  {
    codigo: 'CIRURGIA',
    nome: 'Cirurgia Geral',
    cor: '#10B981',
    icone: 'scalpel',
    ordem: 4,
    temas: [
      { codigo: 'CIR_ABDOMEN_AGUDO', nome: 'Abdomen Agudo' },
      { codigo: 'CIR_TRAUMA', nome: 'Trauma' },
      { codigo: 'CIR_BARIATRICA', nome: 'Cirurgia Bariatrica' },
      { codigo: 'CIR_VASCULAR', nome: 'Cirurgia Vascular' },
    ],
  },
  {
    codigo: 'GO',
    nome: 'Ginecologia e Obstetricia',
    cor: '#EC4899',
    icone: 'venus',
    ordem: 5,
    temas: [
      { codigo: 'GO_PRENATAL', nome: 'Pre-Natal' },
      { codigo: 'GO_PARTO', nome: 'Trabalho de Parto' },
      { codigo: 'GO_ONCO', nome: 'Oncologia Ginecologica' },
      { codigo: 'GO_ENDOMETRIOSE', nome: 'Endometriose' },
    ],
  },
  {
    codigo: 'PSF',
    nome: 'Saude Coletiva / PSF',
    cor: '#6366F1',
    icone: 'users',
    ordem: 6,
    temas: [
      { codigo: 'PSF_EPIDEMIO', nome: 'Epidemiologia' },
      { codigo: 'PSF_SUS', nome: 'Sistema Unico de Saude' },
      { codigo: 'PSF_VIGILANCIA', nome: 'Vigilancia em Saude' },
    ],
  },
  {
    codigo: 'PSIQ',
    nome: 'Psiquiatria',
    cor: '#7C3AED',
    icone: 'brain',
    ordem: 7,
    temas: [
      { codigo: 'PSIQ_DEPRESSAO', nome: 'Depressao' },
      { codigo: 'PSIQ_ANSIEDADE', nome: 'Ansiedade' },
      { codigo: 'PSIQ_PSICOSES', nome: 'Psicoses' },
      { codigo: 'PSIQ_DEPENDENCIA', nome: 'Dependencia Quimica' },
    ],
  },
]

export async function seedEspecialidadesETemas(prisma: PrismaClient) {
  for (const esp of ESPECIALIDADES) {
    const especialidade = await prisma.especialidade.upsert({
      where: { codigo: esp.codigo },
      create: {
        codigo: esp.codigo,
        nome: esp.nome,
        cor: esp.cor,
        icone: esp.icone,
        ordem: esp.ordem,
      },
      update: { nome: esp.nome, cor: esp.cor, icone: esp.icone, ordem: esp.ordem },
    })

    for (const tema of esp.temas) {
      const parent = await prisma.tema.upsert({
        where: { codigo: tema.codigo },
        create: {
          codigo: tema.codigo,
          nome: tema.nome,
          especialidadeId: especialidade.id,
          profundidade: 0,
        },
        update: { nome: tema.nome, especialidadeId: especialidade.id, profundidade: 0 },
      })

      if (tema.filhos) {
        for (const sub of tema.filhos) {
          await prisma.tema.upsert({
            where: { codigo: sub.codigo },
            create: {
              codigo: sub.codigo,
              nome: sub.nome,
              especialidadeId: especialidade.id,
              parentId: parent.id,
              profundidade: 1,
            },
            update: {
              nome: sub.nome,
              especialidadeId: especialidade.id,
              parentId: parent.id,
              profundidade: 1,
            },
          })
        }
      }
    }
  }
}
