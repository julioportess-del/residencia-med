// Constantes/tipos de anexos compartilhados entre cliente e servidor.
// Sem APIs de browser aqui — pode ser importado em Route Handlers.

export type CategoriaAnexoTipo = 'EXAME_LAB' | 'EXAME_IMAGEM' | 'IMAGEM_CLINICA' | 'OUTRO'

export type StatusAnexoTipo = 'ENVIADO' | 'PROCESSANDO' | 'ANALISADO' | 'ERRO'

/** Bucket privado de anexos clínicos (não é segredo; usado por cliente e servidor). */
export const BUCKET_ANEXOS = 'anexos-clinicos'

/** Limite do arquivo BRUTO selecionado (antes do downscale/HEIC→JPEG no cliente). */
export const TAMANHO_MAXIMO_BRUTO_BYTES = 40 * 1024 * 1024 // 40 MB

/** MIME aceitos pelo Claude (imagens) + PDF. HEIC é convertido p/ JPEG no cliente. */
export const TIPOS_ACEITOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const

/** Extensões aceitas no seletor de arquivo (inclui HEIC, convertido antes do upload). */
export const EXTENSOES_ACEITAS = '.jpg,.jpeg,.png,.webp,.gif,.pdf,.heic,.heif'

/** Limite por arquivo após processamento (downscale reduz imagens bem abaixo disso). */
export const TAMANHO_MAXIMO_ANEXO_BYTES = 20 * 1024 * 1024 // 20 MB

/** Máximo de anexos analisados por turno (controle de custo/latência). */
export const MAX_ANEXOS_POR_TURNO = 6

/** Retenção padrão antes da exclusão automática. */
export const RETENCAO_ANEXO_HORAS = 24

export interface AnexoResumo {
  id: string
  nomeArquivo: string
  tipoMime: string
  categoria: CategoriaAnexoTipo
  status: StatusAnexoTipo
  resumoAnalise: string | null
}
