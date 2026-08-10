// Rotulos em pt-BR para os enums do schema clinico (UI sempre em portugues).

export const TIPO_CONSULTA_LABEL: Record<string, string> = {
  DEMANDA_ESPONTANEA: 'Demanda espontânea',
  HIPERTENSAO: 'Hipertensão',
  DIABETES: 'Diabetes',
  RENOVACAO_RECEITA: 'Renovação de receita',
  AVALIACAO_EXAMES: 'Avaliação de exames',
  SAUDE_MENTAL: 'Saúde mental',
  PUERICULTURA: 'Puericultura',
  SAUDE_DA_MULHER: 'Saúde da mulher',
  DOR_LOMBAR: 'Dor lombar',
  CEFALEIA: 'Cefaleia',
  IVAS: 'IVAS',
  DOR_ABDOMINAL: 'Dor abdominal',
  ANSIEDADE: 'Ansiedade',
  ENCAMINHAMENTO: 'Encaminhamento',
  OUTRO: 'Outro',
}

export const TIPO_ATENDIMENTO_LABEL: Record<string, string> = {
  PRIMEIRA_CONSULTA: 'Primeira consulta',
  RETORNO: 'Retorno',
  TELECONSULTA: 'Teleconsulta',
  AVALIACAO: 'Avaliação',
  PROCEDIMENTO: 'Procedimento',
  OUTRO: 'Consulta',
}

export const STATUS_CONSULTA_LABEL: Record<string, string> = {
  GRAVANDO: 'Gravando',
  TRANSCREVENDO: 'Transcrevendo',
  ESTRUTURANDO: 'Estruturando',
  RASCUNHO: 'Rascunho',
  REVISADO: 'Revisado',
}

export const MODELO_EVOLUCAO_LABEL: Record<string, string> = {
  SOAP: 'SOAP',
  CORRIDA: 'Evolução corrida',
  UBS: 'Prontuário UBS',
}

export const TIPO_DOC_MODELO_LABEL: Record<string, string> = {
  EVOLUCAO: 'Evolução',
  RECEITUARIO: 'Receituário',
  ATESTADO: 'Atestado',
  SOLICITACAO_EXAMES: 'Solicitação de exames',
  RESUMO: 'Resumo clínico',
  OUTRO: 'Outro',
}
