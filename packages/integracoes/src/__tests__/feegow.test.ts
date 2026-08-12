import { describe, expect, test, vi } from 'vitest'
import { FeegowAdapter } from '../adapters/feegow'

function fetchMock(resposta: unknown, status = 200) {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => resposta,
  })) as unknown as typeof fetch
}

describe('FeegowAdapter', () => {
  test('declara capacidades corretas (sem write-back de texto via API)', () => {
    const a = new FeegowAdapter({ token: 't' })
    const caps = a.capacidades()
    expect(caps.agendaDoDia).toBe(true)
    expect(caps.buscarPacientePorCpf).toBe(true)
    expect(caps.anexarPdf).toBe(true)
    expect(caps.inserirTextoEvolucao).toBe('extensao-dom')
  })

  test('agendaDoDia converte data para DD-MM-YYYY e mapeia resposta', async () => {
    const f = fetchMock({
      content: [
        {
          agendamento_id: 77,
          paciente_id: 12,
          paciente_nome: 'Maria Silva',
          horario: '14:30:00',
          status_id: 1,
        },
      ],
    })
    const a = new FeegowAdapter({ token: 't', profissionalId: 9, fetchFn: f })

    const agenda = await a.agendaDoDia('2026-08-11')

    expect(f).toHaveBeenCalledWith(
      expect.stringContaining('data_start=11-08-2026'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-access-token': 't' }),
      }),
    )
    expect(f).toHaveBeenCalledWith(expect.stringContaining('profissional_id=9'), expect.anything())
    expect(agenda).toEqual([
      {
        idExterno: '77',
        paciente: { idExterno: '12', nomeCompleto: 'Maria Silva' },
        inicio: '2026-08-11T14:30:00',
        status: '1',
        telemedicina: undefined,
      },
    ])
  })

  test('buscarPacientePorCpf limpa máscara e retorna null sem match', async () => {
    const vazio = new FeegowAdapter({ token: 't', fetchFn: fetchMock({ content: [] }) })
    expect(await vazio.buscarPacientePorCpf('123.456.789-00')).toBeNull()

    const f = fetchMock({
      content: [{ paciente_id: 5, nome_completo: 'João', documentos: { cpf: '12345678900' } }],
    })
    const a = new FeegowAdapter({ token: 't', fetchFn: f })
    const p = await a.buscarPacientePorCpf('123.456.789-00')
    expect(f).toHaveBeenCalledWith(
      expect.stringContaining('paciente_cpf=12345678900'),
      expect.anything(),
    )
    expect(p).toEqual({
      idExterno: '5',
      nomeCompleto: 'João',
      cpf: '12345678900',
      dataNascimento: undefined,
    })
  })

  test('anexarPdf monta data URI e retorna fileId', async () => {
    const f = fetchMock({ success: true, fileId: 321 })
    const a = new FeegowAdapter({ token: 't', fetchFn: f })

    const r = await a.anexarPdf('12', {
      nomeArquivo: 'evolucao.pdf',
      descricao: 'Evolução 11/08',
      base64: 'QUJD',
    })

    expect(r).toEqual({ idArquivo: '321' })
    const [, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      { body: string },
    ]
    const corpo = JSON.parse(init.body) as { base64_file: string; paciente_id: number }
    expect(corpo.paciente_id).toBe(12)
    expect(corpo.base64_file).toBe('data:application/pdf;base64,QUJD')
  })

  test('erro HTTP vira exceção clara', async () => {
    const a = new FeegowAdapter({ token: 't', fetchFn: fetchMock({}, 429) })
    await expect(a.agendaDoDia('2026-08-11')).rejects.toThrow('HTTP 429')
  })
})
