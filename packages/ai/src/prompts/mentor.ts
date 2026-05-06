export const VERSAO_MENTOR = '1.0.0'

export const SYSTEM_MENTOR = `Você é um mentor experiente para estudantes de residência médica brasileira.

Princípios:
- Seja direto e prático. Evite enrolar.
- Quando responder dúvida clínica, cite a diretriz brasileira aplicável (SBP, SBC, MS) e o ano.
- Se a pergunta envolver caso clínico, raciocine em voz alta de forma estruturada (anamnese → exame → diagnóstico diferencial → conduta).
- Use o histórico do estudante para personalizar respostas. Se ele errou em fibrilação atrial recentemente, lembre o ponto exato que falhou.
- Em dúvidas de estratégia de estudo, considere a banca-alvo, a data da prova e o histórico de desempenho.
- Não invente dados clínicos. Se não souber, diga que não sabe e sugira a fonte para consultar.
- Markdown é bem-vindo (cabeçalhos curtos, listas).
- Português brasileiro, tratamento "você".

Contexto do estudante e histórico recente vão ser fornecidos como mensagens prévias do tipo SISTEMA.`

export type ContextoEstudante = {
  nome?: string | null
  bancaAlvo?: string | null
  dataProva?: Date | null
  cargaHorariaSemanal?: number | null
  totalRespostas: number
  taxaAcerto: number
  fracos: Array<{ tema: string; taxa: number }>
  fortes: Array<{ tema: string; taxa: number }>
  itensRevisaoVencidos: number
}

export function montarContextoMd(c: ContextoEstudante): string {
  const linhas: string[] = ['## Contexto do estudante']
  if (c.nome) linhas.push(`- Nome: ${c.nome}`)
  if (c.bancaAlvo) linhas.push(`- Banca-alvo: ${c.bancaAlvo}`)
  if (c.dataProva) {
    const dias = Math.max(0, Math.ceil((c.dataProva.getTime() - Date.now()) / 86_400_000))
    linhas.push(`- Data da prova: ${c.dataProva.toISOString().slice(0, 10)} (faltam ${dias} dias)`)
  }
  if (c.cargaHorariaSemanal) linhas.push(`- Carga horária: ${c.cargaHorariaSemanal} h/semana`)
  linhas.push(`- Total de respostas: ${c.totalRespostas}`)
  linhas.push(`- Taxa de acerto geral: ${Math.round(c.taxaAcerto * 100)}%`)
  if (c.itensRevisaoVencidos > 0) {
    linhas.push(`- Itens de revisão vencidos hoje: ${c.itensRevisaoVencidos}`)
  }
  if (c.fracos.length > 0) {
    linhas.push(
      `- Pontos fracos: ${c.fracos.map((f) => `${f.tema} (${Math.round(f.taxa * 100)}%)`).join(', ')}`,
    )
  }
  if (c.fortes.length > 0) {
    linhas.push(
      `- Pontos fortes: ${c.fortes.map((f) => `${f.tema} (${Math.round(f.taxa * 100)}%)`).join(', ')}`,
    )
  }
  return linhas.join('\n')
}
