import { describe, expect, it } from 'vitest'
import {
  DIAS_ALERTA_LOGISTICA,
  diasAteData,
  etapaProcesso,
  pctAcertos,
  pendenciasProcesso,
  proximasProvas,
  type ProcessoSeletivoDados,
} from '../minhas-provas'

// 15/10/2026, 12h em Brasília
const HOJE = new Date('2026-10-15T15:00:00Z')
// @db.Date chega do Prisma como meia-noite UTC
const d = (chave: string) => new Date(`${chave}T00:00:00Z`)

function processo(p: Partial<ProcessoSeletivoDados> = {}): ProcessoSeletivoDados {
  return {
    id: 'p1',
    instituicao: 'HCPA',
    especialidade: 'Cirurgia Geral',
    editalPublicado: false,
    inscricaoFeita: false,
    inscricaoPaga: false,
    logisticaOrganizada: false,
    inicioInscricoes: null,
    fimInscricoes: null,
    dataProva: null,
    provaRealizada: false,
    acertos: null,
    totalQuestoes: null,
    ...p,
  }
}

describe('diasAteData', () => {
  it('trata data de calendário sem deslocar fuso', () => {
    expect(diasAteData(d('2026-10-15'), HOJE)).toBe(0)
    expect(diasAteData(d('2026-10-16'), HOJE)).toBe(1)
    expect(diasAteData(d('2026-10-14'), HOJE)).toBe(-1)
  })

  it('usa o dia de Brasília para "hoje" (23h30 BRT ainda é o mesmo dia)', () => {
    const noite = new Date('2026-10-16T02:30:00Z') // 15/10 23h30 BRT
    expect(diasAteData(d('2026-10-16'), noite)).toBe(1)
  })

  it('retorna null sem data', () => {
    expect(diasAteData(null, HOJE)).toBeNull()
  })
})

describe('etapaProcesso', () => {
  it('sem edital', () => {
    expect(etapaProcesso(processo(), HOJE)).toBe('AGUARDANDO_EDITAL')
  })

  it('edital publicado sem datas', () => {
    expect(etapaProcesso(processo({ editalPublicado: true }), HOJE)).toBe('EDITAL_PUBLICADO')
  })

  it('inscrições em breve, abertas e encerradas', () => {
    const base = { editalPublicado: true, fimInscricoes: d('2026-10-30') }
    expect(etapaProcesso(processo({ ...base, inicioInscricoes: d('2026-10-20') }), HOJE)).toBe(
      'INSCRICOES_EM_BREVE',
    )
    expect(etapaProcesso(processo({ ...base, inicioInscricoes: d('2026-10-15') }), HOJE)).toBe(
      'INSCRICOES_ABERTAS',
    )
    expect(
      etapaProcesso(processo({ editalPublicado: true, fimInscricoes: d('2026-10-14') }), HOJE),
    ).toBe('INSCRICOES_ENCERRADAS')
  })

  it('inscrição feita vira INSCRITO mesmo com inscrições encerradas', () => {
    expect(
      etapaProcesso(processo({ inscricaoFeita: true, fimInscricoes: d('2026-10-01') }), HOJE),
    ).toBe('INSCRITO')
  })

  it('dia da prova, prova passada e realizada', () => {
    expect(etapaProcesso(processo({ dataProva: d('2026-10-15') }), HOJE)).toBe('PROVA_HOJE')
    expect(etapaProcesso(processo({ dataProva: d('2026-10-10') }), HOJE)).toBe('PROVA_PASSOU')
    expect(
      etapaProcesso(processo({ dataProva: d('2026-10-10'), provaRealizada: true }), HOJE),
    ).toBe('REALIZADA')
  })
})

describe('pendenciasProcesso', () => {
  it('avisa inscrições abertas não feitas, urgente nos últimos 3 dias', () => {
    const p = processo({ editalPublicado: true, fimInscricoes: d('2026-10-17') })
    const [pend] = pendenciasProcesso(p, HOJE)
    expect(pend).toMatchObject({ tipo: 'FAZER_INSCRICAO', urgente: true })
    expect(pend?.mensagem).toContain('2 dias')

    const folgado = processo({ editalPublicado: true, fimInscricoes: d('2026-11-30') })
    expect(pendenciasProcesso(folgado, HOJE)[0]).toMatchObject({ urgente: false })
  })

  it('cobra pagamento quando inscrito e não pago', () => {
    const tipos = pendenciasProcesso(processo({ inscricaoFeita: true }), HOJE).map((x) => x.tipo)
    expect(tipos).toContain('PAGAR_INSCRICAO')
  })

  it(`cobra logística só a até ${DIAS_ALERTA_LOGISTICA} dias da prova`, () => {
    const perto = processo({
      inscricaoFeita: true,
      inscricaoPaga: true,
      dataProva: d('2026-11-01'),
    })
    const longe = processo({
      inscricaoFeita: true,
      inscricaoPaga: true,
      dataProva: d('2027-03-01'),
    })
    expect(pendenciasProcesso(perto, HOJE).map((x) => x.tipo)).toEqual(['ORGANIZAR_LOGISTICA'])
    expect(pendenciasProcesso(longe, HOJE)).toEqual([])
  })

  it('após a prova pede para marcar realizada e depois registrar acertos', () => {
    const passou = processo({
      inscricaoFeita: true,
      inscricaoPaga: true,
      dataProva: d('2026-10-10'),
    })
    expect(pendenciasProcesso(passou, HOJE).map((x) => x.tipo)).toEqual(['MARCAR_REALIZADA'])
    const realizada = { ...passou, provaRealizada: true }
    expect(pendenciasProcesso(realizada, HOJE).map((x) => x.tipo)).toEqual(['REGISTRAR_ACERTOS'])
    expect(pendenciasProcesso({ ...realizada, acertos: 80 }, HOJE)).toEqual([])
  })
})

describe('proximasProvas', () => {
  it('lista só provas futuras não realizadas, da mais próxima para a mais distante', () => {
    const lista = [
      processo({ id: 'longe', dataProva: d('2026-12-10') }),
      processo({ id: 'sem-data' }),
      processo({ id: 'passou', dataProva: d('2026-10-01') }),
      processo({ id: 'hoje', dataProva: d('2026-10-15') }),
      processo({ id: 'feita', dataProva: d('2026-11-01'), provaRealizada: true }),
      processo({ id: 'perto', dataProva: d('2026-11-05') }),
    ]
    const r = proximasProvas(lista, HOJE)
    expect(r.map((x) => x.id)).toEqual(['hoje', 'perto', 'longe'])
    expect(r[0]).toMatchObject({ diasAteProva: 0, etapa: 'PROVA_HOJE' })
    expect(r[1]?.dataProva).toBe('2026-11-05')
  })

  it('respeita o limite', () => {
    const lista = ['2026-11-01', '2026-11-02', '2026-11-03'].map((c, i) =>
      processo({ id: String(i), dataProva: d(c) }),
    )
    expect(proximasProvas(lista, HOJE, 2)).toHaveLength(2)
  })
})

describe('pctAcertos', () => {
  it('calcula percentual arredondado', () => {
    expect(pctAcertos(80, 120)).toBe(67)
  })

  it('null quando falta dado', () => {
    expect(pctAcertos(null, 100)).toBeNull()
    expect(pctAcertos(50, null)).toBeNull()
    expect(pctAcertos(50, 0)).toBeNull()
  })
})
