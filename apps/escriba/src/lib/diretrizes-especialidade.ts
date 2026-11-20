/**
 * Roteador clínico de DIRETRIZES OFICIAIS por foco da consulta.
 *
 * Sociedades médicas não expõem API pública — o que dá para fazer com
 * honestidade é rotear o médico para o portal OFICIAL de diretrizes da(s)
 * entidade(s) pertinentes ao tema, em 1 clique. URLs são portais estáveis
 * (nunca PDFs profundos). Fontes com API real (PubMed/Europe PMC/
 * ClinicalTrials) seguem no Evidence Engine automático.
 */

export interface DiretrizSugerida {
  instituicao: string
  nome: string
  url: string
}

const MS_PCDT: DiretrizSugerida = {
  instituicao: 'Ministério da Saúde / CONITEC',
  nome: 'Protocolos Clínicos e Diretrizes Terapêuticas (PCDT)',
  url: 'https://www.gov.br/conitec/pt-br/assuntos/avaliacao-de-tecnologias-em-saude/protocolos-clinicos-e-diretrizes-terapeuticas',
}

const POR_FOCO: Record<string, DiretrizSugerida[]> = {
  HIPERTENSAO: [
    {
      instituicao: 'SBC',
      nome: 'Diretrizes da Sociedade Brasileira de Cardiologia',
      url: 'https://www.portal.cardiol.br/diretrizes',
    },
    {
      instituicao: 'AHA/ACC',
      nome: 'Guidelines — American Heart Association',
      url: 'https://professional.heart.org/en/guidelines-and-statements',
    },
    {
      instituicao: 'ESC',
      nome: 'Clinical Practice Guidelines — European Society of Cardiology',
      url: 'https://www.escardio.org/Guidelines',
    },
  ],
  DIABETES: [
    {
      instituicao: 'SBD',
      nome: 'Diretriz Oficial da Sociedade Brasileira de Diabetes',
      url: 'https://diretriz.diabetes.org.br/',
    },
    {
      instituicao: 'ADA',
      nome: 'Standards of Care in Diabetes',
      url: 'https://diabetesjournals.org/care/issue',
    },
  ],
  SAUDE_DA_MULHER: [
    {
      instituicao: 'Febrasgo',
      nome: 'Diretrizes e protocolos Febrasgo',
      url: 'https://www.febrasgo.org.br/',
    },
    {
      instituicao: 'ACOG',
      nome: 'Clinical Guidance — ACOG',
      url: 'https://www.acog.org/clinical',
    },
  ],
  PUERICULTURA: [
    {
      instituicao: 'SBP',
      nome: 'Documentos científicos — Sociedade Brasileira de Pediatria',
      url: 'https://www.sbp.com.br/departamentos-cientificos/documentos-cientificos/',
    },
    {
      instituicao: 'AAP',
      nome: 'Clinical guidance — American Academy of Pediatrics',
      url: 'https://www.aap.org/en/practice-management/clinical-guidance/',
    },
  ],
  SAUDE_MENTAL: [
    {
      instituicao: 'ABP',
      nome: 'Diretrizes — Associação Brasileira de Psiquiatria',
      url: 'https://www.abp.org.br/diretrizes',
    },
    {
      instituicao: 'NICE',
      nome: 'Mental health guidance — NICE',
      url: 'https://www.nice.org.uk/guidance/conditions-and-diseases/mental-health-and-behavioural-conditions',
    },
  ],
  ANSIEDADE: [
    {
      instituicao: 'NICE',
      nome: 'Anxiety guidance — NICE',
      url: 'https://www.nice.org.uk/guidance/conditions-and-diseases/mental-health-and-behavioural-conditions',
    },
  ],
  IVAS: [
    {
      instituicao: 'SBPT',
      nome: 'Diretrizes — Sociedade Brasileira de Pneumologia e Tisiologia',
      url: 'https://sbpt.org.br/portal/publicacoes/diretrizes/',
    },
    {
      instituicao: 'GINA',
      nome: 'Global Initiative for Asthma (GINA) Reports',
      url: 'https://ginasthma.org/reports/',
    },
    {
      instituicao: 'GOLD',
      nome: 'GOLD Reports (DPOC)',
      url: 'https://goldcopd.org/2026-gold-report/',
    },
  ],
  DOR_LOMBAR: [
    {
      instituicao: 'NICE',
      nome: 'Low back pain and sciatica — NICE',
      url: 'https://www.nice.org.uk/guidance/ng59',
    },
  ],
  CEFALEIA: [
    {
      instituicao: 'SBCe/ABN',
      nome: 'Academia Brasileira de Neurologia — diretrizes',
      url: 'https://abneuro.org.br/',
    },
  ],
}

const GERAL: DiretrizSugerida[] = [
  MS_PCDT,
  {
    instituicao: 'OMS',
    nome: 'WHO Guidelines',
    url: 'https://www.who.int/publications/who-guidelines',
  },
]

/** Diretrizes oficiais pertinentes ao foco clínico (sempre inclui MS/PCDT). */
export function diretrizesParaFoco(focoClinico: string | null | undefined): DiretrizSugerida[] {
  const especificas = POR_FOCO[focoClinico ?? ''] ?? []
  return [...especificas, ...GERAL].slice(0, 5)
}
