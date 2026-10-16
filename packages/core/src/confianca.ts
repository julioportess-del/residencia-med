/**
 * Cruza a confiança declarada ANTES do gabarito com o resultado.
 * Base: efeito de hipercorreção — erros cometidos com alta confiança são os
 * que mais merecem atenção (e os que mais se corrigem quando revisados).
 */

export type NivelConfianca = 'CHUTE' | 'INCERTO' | 'CONFIANTE' | 'NAO_SEI'

export type CategoriaConfianca =
  | 'FALSA_COMPREENSAO'
  | 'LACUNA'
  | 'PARCIAL'
  | 'ACERTO_SEM_DOMINIO'
  | 'DOMINIO_PROVAVEL'
  | 'SEM_REGISTRO'

export type InterpretacaoConfianca = {
  categoria: CategoriaConfianca
  titulo: string
  orientacao: string
  gravidade: 'alta' | 'media' | 'baixa'
  /** Se o acerto pode entrar como evidência de domínio do assunto. */
  contaComoDominio: boolean
}

export function interpretarConfianca(
  confianca: NivelConfianca | null | undefined,
  correta: boolean,
): InterpretacaoConfianca {
  if (!confianca) {
    return {
      categoria: 'SEM_REGISTRO',
      titulo: correta ? 'Acertou' : 'Errou',
      orientacao: 'Registrar a confiança antes de responder ajuda a calibrar suas revisões.',
      gravidade: 'baixa',
      contaComoDominio: false,
    }
  }

  if (!correta && confianca === 'CONFIANTE') {
    return {
      categoria: 'FALSA_COMPREENSAO',
      titulo: 'Certeza com erro: possível falsa compreensão',
      orientacao:
        'Você tinha certeza e errou. Releia o conceito central — este tipo de erro tende a se repetir se não for corrigido.',
      gravidade: 'alta',
      contaComoDominio: false,
    }
  }

  if (!correta) {
    return {
      categoria: 'LACUNA',
      titulo: confianca === 'NAO_SEI' ? 'Conteúdo que você ainda não domina' : 'Lacuna reconhecida',
      orientacao:
        confianca === 'NAO_SEI'
          ? 'Estude o conceito pelo comentário antes de seguir. A questão volta em breve na revisão.'
          : 'Você já desconfiava. A questão volta em breve na sua revisão.',
      gravidade: 'media',
      contaComoDominio: false,
    }
  }

  if (confianca === 'CHUTE' || confianca === 'NAO_SEI') {
    return {
      categoria: 'ACERTO_SEM_DOMINIO',
      titulo: confianca === 'NAO_SEI' ? 'Acertou sem saber' : 'Acerto no chute',
      orientacao: 'Não conta como domínio do assunto. Vale revisar o porquê da resposta.',
      gravidade: 'media',
      contaComoDominio: false,
    }
  }

  if (confianca === 'INCERTO') {
    return {
      categoria: 'PARCIAL',
      titulo: 'Acerto com dúvida',
      orientacao: 'Conhecimento parcialmente consolidado. Uma revisão rápida ajuda a fixar.',
      gravidade: 'baixa',
      contaComoDominio: true,
    }
  }

  return {
    categoria: 'DOMINIO_PROVAVEL',
    titulo: 'Acerto com certeza',
    orientacao: 'Domínio provável — será confirmado se você continuar acertando nas revisões.',
    gravidade: 'baixa',
    contaComoDominio: true,
  }
}
