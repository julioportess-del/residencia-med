/**
 * Taxonomia de temas para provas de R1 / Acesso Direto (5 grandes áreas).
 *
 * ADITIVA: mantém os códigos já existentes no banco e acrescenta os que faltam
 * para cobrir o que as bancas cobram (neuro, hemato, uro, orto, ética, etc.).
 * As "especialidades" do banco são agrupadas em grandes áreas para o painel.
 */

export type GrandeArea = 'CLINICA_MEDICA' | 'CIRURGIA' | 'GO' | 'PEDIATRIA' | 'PREVENTIVA'

export const GRANDE_AREA_POR_ESPECIALIDADE: Record<string, GrandeArea> = {
  CLINICA: 'CLINICA_MEDICA',
  CARDIO: 'CLINICA_MEDICA',
  PSIQ: 'CLINICA_MEDICA',
  CIRURGIA: 'CIRURGIA',
  GO: 'GO',
  PEDIA: 'PEDIATRIA',
  PSF: 'PREVENTIVA',
}

export const NOME_GRANDE_AREA: Record<GrandeArea, string> = {
  CLINICA_MEDICA: 'Clínica Médica',
  CIRURGIA: 'Cirurgia',
  GO: 'Ginecologia e Obstetrícia',
  PEDIATRIA: 'Pediatria',
  PREVENTIVA: 'Medicina Preventiva',
}

export type TemaTaxonomiaR1 = {
  codigo: string
  nome: string
  especialidade: keyof typeof GRANDE_AREA_POR_ESPECIALIDADE
  /** Código do tema pai (hierarquia), quando houver. */
  pai?: string
}

/** Temas que já existem no banco (não alterar códigos). */
const EXISTENTES: TemaTaxonomiaR1[] = [
  { codigo: 'CARDIO_ARRITMIAS', nome: 'Arritmias', especialidade: 'CARDIO' },
  {
    codigo: 'CARDIO_ARRITMIAS_FA',
    nome: 'Fibrilação Atrial',
    especialidade: 'CARDIO',
    pai: 'CARDIO_ARRITMIAS',
  },
  {
    codigo: 'CARDIO_ARRITMIAS_TV',
    nome: 'Taquicardia Ventricular',
    especialidade: 'CARDIO',
    pai: 'CARDIO_ARRITMIAS',
  },
  { codigo: 'CARDIO_HAS', nome: 'Hipertensão Arterial', especialidade: 'CARDIO' },
  { codigo: 'CARDIO_IC', nome: 'Insuficiência Cardíaca', especialidade: 'CARDIO' },
  { codigo: 'CARDIO_SCA', nome: 'Síndromes Coronarianas Agudas', especialidade: 'CARDIO' },
  { codigo: 'CARDIO_SCA_IAM', nome: 'IAM com supra', especialidade: 'CARDIO', pai: 'CARDIO_SCA' },
  {
    codigo: 'CARDIO_SCA_NSTEMI',
    nome: 'IAM sem supra / AI',
    especialidade: 'CARDIO',
    pai: 'CARDIO_SCA',
  },
  { codigo: 'CARDIO_VALVAS', nome: 'Valvopatias', especialidade: 'CARDIO' },
  { codigo: 'CIR_ABDOMEN_AGUDO', nome: 'Abdome Agudo', especialidade: 'CIRURGIA' },
  { codigo: 'CIR_BARIATRICA', nome: 'Cirurgia Bariátrica', especialidade: 'CIRURGIA' },
  { codigo: 'CIR_TRAUMA', nome: 'Trauma', especialidade: 'CIRURGIA' },
  { codigo: 'CIR_VASCULAR', nome: 'Cirurgia Vascular', especialidade: 'CIRURGIA' },
  { codigo: 'CLINICA_ENDOCRINO', nome: 'Endocrinologia', especialidade: 'CLINICA' },
  { codigo: 'CLINICA_GASTRO', nome: 'Gastroenterologia', especialidade: 'CLINICA' },
  { codigo: 'CLINICA_INFECTO', nome: 'Infectologia', especialidade: 'CLINICA' },
  { codigo: 'CLINICA_NEFRO', nome: 'Nefrologia', especialidade: 'CLINICA' },
  { codigo: 'CLINICA_PNEUMO', nome: 'Pneumologia', especialidade: 'CLINICA' },
  { codigo: 'CLINICA_REUMATO', nome: 'Reumatologia', especialidade: 'CLINICA' },
  { codigo: 'GO_ENDOMETRIOSE', nome: 'Endometriose', especialidade: 'GO' },
  { codigo: 'GO_ONCO', nome: 'Oncologia Ginecológica', especialidade: 'GO' },
  { codigo: 'GO_PARTO', nome: 'Trabalho de Parto', especialidade: 'GO' },
  { codigo: 'GO_PRENATAL', nome: 'Pré-Natal', especialidade: 'GO' },
  { codigo: 'PEDIA_ALEITAMENTO', nome: 'Aleitamento e Nutrição', especialidade: 'PEDIA' },
  {
    codigo: 'PEDIA_DESENVOLVIMENTO',
    nome: 'Crescimento e Desenvolvimento',
    especialidade: 'PEDIA',
  },
  { codigo: 'PEDIA_INFECTO', nome: 'Infectologia Pediátrica', especialidade: 'PEDIA' },
  { codigo: 'PEDIA_NEO', nome: 'Neonatologia', especialidade: 'PEDIA' },
  { codigo: 'PEDIA_VACINAS', nome: 'Vacinação', especialidade: 'PEDIA' },
  { codigo: 'PSF_EPIDEMIO', nome: 'Epidemiologia', especialidade: 'PSF' },
  { codigo: 'PSF_SUS', nome: 'Sistema Único de Saúde', especialidade: 'PSF' },
  { codigo: 'PSF_VIGILANCIA', nome: 'Vigilância em Saúde', especialidade: 'PSF' },
  { codigo: 'PSIQ_ANSIEDADE', nome: 'Ansiedade', especialidade: 'PSIQ' },
  { codigo: 'PSIQ_DEPENDENCIA', nome: 'Dependência Química', especialidade: 'PSIQ' },
  { codigo: 'PSIQ_DEPRESSAO', nome: 'Depressão', especialidade: 'PSIQ' },
  { codigo: 'PSIQ_PSICOSES', nome: 'Psicoses', especialidade: 'PSIQ' },
]

/** Acréscimos para cobrir o conteúdo de R1 / Acesso Direto. */
const NOVOS: TemaTaxonomiaR1[] = [
  // Clínica Médica
  { codigo: 'CARDIO_DISLIPIDEMIA', nome: 'Dislipidemias', especialidade: 'CARDIO' },
  {
    codigo: 'CARDIO_ENDOCARDITE_PERICARDIO',
    nome: 'Endocardite, miocardite e pericardite',
    especialidade: 'CARDIO',
  },
  {
    codigo: 'CARDIO_SINCOPE_PCR',
    nome: 'Síncope e parada cardiorrespiratória (ACLS)',
    especialidade: 'CARDIO',
  },
  {
    codigo: 'CLINICA_DIABETES',
    nome: 'Diabetes mellitus e emergências glicêmicas',
    especialidade: 'CLINICA',
    pai: 'CLINICA_ENDOCRINO',
  },
  {
    codigo: 'CLINICA_TIREOIDE',
    nome: 'Tireoide',
    especialidade: 'CLINICA',
    pai: 'CLINICA_ENDOCRINO',
  },
  {
    codigo: 'CLINICA_ADRENAL_HIPOFISE',
    nome: 'Adrenal, hipófise e osteometabólico',
    especialidade: 'CLINICA',
    pai: 'CLINICA_ENDOCRINO',
  },
  { codigo: 'CLINICA_HEPATO', nome: 'Hepatologia', especialidade: 'CLINICA' },
  {
    codigo: 'CLINICA_DII_PANCREAS',
    nome: 'Doença inflamatória intestinal e pâncreas',
    especialidade: 'CLINICA',
    pai: 'CLINICA_GASTRO',
  },
  {
    codigo: 'CLINICA_HIV_IST',
    nome: 'HIV e infecções sexualmente transmissíveis',
    especialidade: 'CLINICA',
    pai: 'CLINICA_INFECTO',
  },
  {
    codigo: 'CLINICA_SEPSE',
    nome: 'Sepse e choque',
    especialidade: 'CLINICA',
    pai: 'CLINICA_INFECTO',
  },
  {
    codigo: 'CLINICA_ARBOVIROSES_TROPICAIS',
    nome: 'Arboviroses e doenças tropicais',
    especialidade: 'CLINICA',
    pai: 'CLINICA_INFECTO',
  },
  {
    codigo: 'CLINICA_TUBERCULOSE',
    nome: 'Tuberculose e micobactérias',
    especialidade: 'CLINICA',
    pai: 'CLINICA_INFECTO',
  },
  {
    codigo: 'CLINICA_DISTURBIOS_HE_AB',
    nome: 'Distúrbios hidroeletrolíticos e ácido-base',
    especialidade: 'CLINICA',
    pai: 'CLINICA_NEFRO',
  },
  {
    codigo: 'CLINICA_IRA_DRC',
    nome: 'Lesão renal aguda e doença renal crônica',
    especialidade: 'CLINICA',
    pai: 'CLINICA_NEFRO',
  },
  {
    codigo: 'CLINICA_ASMA_DPOC',
    nome: 'Asma e DPOC',
    especialidade: 'CLINICA',
    pai: 'CLINICA_PNEUMO',
  },
  {
    codigo: 'CLINICA_TEP_TVP',
    nome: 'Tromboembolismo venoso',
    especialidade: 'CLINICA',
    pai: 'CLINICA_PNEUMO',
  },
  {
    codigo: 'CLINICA_PNEUMONIA',
    nome: 'Pneumonias',
    especialidade: 'CLINICA',
    pai: 'CLINICA_PNEUMO',
  },
  {
    codigo: 'CLINICA_HEMATO',
    nome: 'Hematologia (anemias, coagulação, hemoterapia)',
    especialidade: 'CLINICA',
  },
  { codigo: 'CLINICA_ONCO', nome: 'Oncologia clínica', especialidade: 'CLINICA' },
  {
    codigo: 'CLINICA_NEURO',
    nome: 'Neurologia (AVC, cefaleia, epilepsia, demências)',
    especialidade: 'CLINICA',
  },
  { codigo: 'CLINICA_DERMATO', nome: 'Dermatologia', especialidade: 'CLINICA' },
  {
    codigo: 'CLINICA_EMERGENCIA',
    nome: 'Emergência clínica e intoxicações',
    especialidade: 'CLINICA',
  },
  {
    codigo: 'CLINICA_GERIATRIA',
    nome: 'Geriatria e cuidados paliativos',
    especialidade: 'CLINICA',
  },
  {
    codigo: 'PSIQ_OUTROS',
    nome: 'Outros transtornos psiquiátricos e emergência psiquiátrica',
    especialidade: 'PSIQ',
  },
  // Cirurgia
  {
    codigo: 'CIR_PERIOPERATORIO',
    nome: 'Pré e pós-operatório, anestesia e complicações cirúrgicas',
    especialidade: 'CIRURGIA',
  },
  { codigo: 'CIR_HERNIAS_PAREDE', nome: 'Hérnias e parede abdominal', especialidade: 'CIRURGIA' },
  { codigo: 'CIR_ESOFAGO_ESTOMAGO', nome: 'Esôfago e estômago', especialidade: 'CIRURGIA' },
  {
    codigo: 'CIR_VIAS_BILIARES_FIGADO',
    nome: 'Vias biliares, fígado e pâncreas cirúrgicos',
    especialidade: 'CIRURGIA',
  },
  { codigo: 'CIR_COLOPROCTO', nome: 'Coloproctologia', especialidade: 'CIRURGIA' },
  { codigo: 'CIR_UROLOGIA', nome: 'Urologia', especialidade: 'CIRURGIA' },
  { codigo: 'CIR_ORTOPEDIA', nome: 'Ortopedia e traumatologia', especialidade: 'CIRURGIA' },
  {
    codigo: 'CIR_CABECA_PESCOCO',
    nome: 'Cabeça e pescoço, tireoide cirúrgica e otorrino',
    especialidade: 'CIRURGIA',
  },
  { codigo: 'CIR_TORACICA', nome: 'Cirurgia torácica', especialidade: 'CIRURGIA' },
  {
    codigo: 'CIR_QUEIMADURAS_PLASTICA',
    nome: 'Queimaduras e cirurgia plástica',
    especialidade: 'CIRURGIA',
  },
  { codigo: 'CIR_PEDIATRICA', nome: 'Cirurgia pediátrica', especialidade: 'CIRURGIA' },
  {
    codigo: 'CIR_ONCO',
    nome: 'Oncologia cirúrgica (mama, cólon, outros)',
    especialidade: 'CIRURGIA',
  },
  { codigo: 'CIR_OFTALMO', nome: 'Oftalmologia', especialidade: 'CIRURGIA' },
  // Ginecologia e Obstetrícia
  { codigo: 'GO_SANGRAMENTOS_GESTACAO', nome: 'Sangramentos da gestação', especialidade: 'GO' },
  {
    codigo: 'GO_HIPERTENSAO_GESTACAO',
    nome: 'Síndromes hipertensivas da gestação',
    especialidade: 'GO',
  },
  {
    codigo: 'GO_DIABETES_INFECCOES_GESTACAO',
    nome: 'Diabetes, infecções e intercorrências clínicas na gestação',
    especialidade: 'GO',
  },
  { codigo: 'GO_PUERPERIO', nome: 'Puerpério e hemorragia pós-parto', especialidade: 'GO' },
  {
    codigo: 'GO_VITALIDADE_FETAL',
    nome: 'Vitalidade fetal, prematuridade e RPMO',
    especialidade: 'GO',
  },
  {
    codigo: 'GO_CICLO_AMENORREIA',
    nome: 'Ciclo menstrual, amenorreias e SOP',
    especialidade: 'GO',
  },
  { codigo: 'GO_CLIMATERIO', nome: 'Climatério e terapia hormonal', especialidade: 'GO' },
  { codigo: 'GO_CONTRACEPCAO', nome: 'Planejamento familiar e contracepção', especialidade: 'GO' },
  { codigo: 'GO_INFECCOES_GINECO', nome: 'Vulvovaginites, IST e DIP', especialidade: 'GO' },
  { codigo: 'GO_MAMA', nome: 'Mastologia', especialidade: 'GO' },
  {
    codigo: 'GO_RASTREIO_COLO',
    nome: 'Rastreamento e lesões do colo uterino',
    especialidade: 'GO',
  },
  {
    codigo: 'GO_INFERTILIDADE_UROGINECO',
    nome: 'Infertilidade, sangramento uterino anormal e uroginecologia',
    especialidade: 'GO',
  },
  {
    codigo: 'GO_VIOLENCIA_SEXUAL',
    nome: 'Violência sexual e aspectos legais',
    especialidade: 'GO',
  },
  // Pediatria
  {
    codigo: 'PEDIA_EMERGENCIA',
    nome: 'Emergência pediátrica e reanimação',
    especialidade: 'PEDIA',
  },
  {
    codigo: 'PEDIA_RESPIRATORIO',
    nome: 'Doenças respiratórias na infância',
    especialidade: 'PEDIA',
  },
  {
    codigo: 'PEDIA_GASTRO_DIARREIA',
    nome: 'Diarreia, desidratação e gastroenterologia pediátrica',
    especialidade: 'PEDIA',
  },
  { codigo: 'PEDIA_EXANTEMATICAS', nome: 'Doenças exantemáticas', especialidade: 'PEDIA' },
  {
    codigo: 'PEDIA_NEFRO_URO',
    nome: 'Nefrologia e infecção urinária na infância',
    especialidade: 'PEDIA',
  },
  {
    codigo: 'PEDIA_CARDIO',
    nome: 'Cardiopatias congênitas e febre reumática',
    especialidade: 'PEDIA',
  },
  {
    codigo: 'PEDIA_ENDOCRINO_ADOLESCENCIA',
    nome: 'Endocrinologia pediátrica e adolescência',
    especialidade: 'PEDIA',
  },
  {
    codigo: 'PEDIA_HEMATO_ONCO',
    nome: 'Hematologia e oncologia pediátrica',
    especialidade: 'PEDIA',
  },
  {
    codigo: 'PEDIA_MAUS_TRATOS',
    nome: 'Maus-tratos e prevenção de acidentes',
    especialidade: 'PEDIA',
  },
  // Medicina Preventiva
  {
    codigo: 'PSF_BIOESTATISTICA',
    nome: 'Bioestatística e testes diagnósticos',
    especialidade: 'PSF',
  },
  {
    codigo: 'PSF_ESTUDOS',
    nome: 'Desenhos de estudo e medicina baseada em evidências',
    especialidade: 'PSF',
  },
  {
    codigo: 'PSF_ATENCAO_PRIMARIA',
    nome: 'Atenção primária e Estratégia Saúde da Família',
    especialidade: 'PSF',
  },
  { codigo: 'PSF_ETICA', nome: 'Ética médica, bioética e documentação', especialidade: 'PSF' },
  { codigo: 'PSF_TRABALHO', nome: 'Saúde do trabalhador', especialidade: 'PSF' },
  {
    codigo: 'PSF_PREVENCAO_RASTREIO',
    nome: 'Níveis de prevenção e rastreamento',
    especialidade: 'PSF',
  },
  {
    codigo: 'PSF_INDICADORES',
    nome: 'Indicadores de saúde e transição demográfica',
    especialidade: 'PSF',
  },
]

export const TAXONOMIA_R1: readonly TemaTaxonomiaR1[] = [...EXISTENTES, ...NOVOS]

export function grandeAreaDoTema(tema: Pick<TemaTaxonomiaR1, 'especialidade'>): GrandeArea | null {
  return GRANDE_AREA_POR_ESPECIALIDADE[tema.especialidade] ?? null
}
