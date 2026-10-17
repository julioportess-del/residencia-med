import { describe, expect, it } from 'vitest'
import { mensagemErroIA } from '../erros'

describe('mensagemErroIA', () => {
  it('traduz limite de uso da conta sem expor o JSON', () => {
    const msg = mensagemErroIA(
      new Error(
        '400 {"type":"error","error":{"type":"invalid_request_error","message":"You have reached your specified API usage limits."}}',
      ),
    )
    expect(msg).toContain('limite de uso')
    expect(msg).not.toContain('{')
  })

  it('traduz sobrecarga e cai num genérico para o resto', () => {
    expect(mensagemErroIA(new Error('529 overloaded_error'))).toContain('sobrecarregada')
    expect(mensagemErroIA('qualquer coisa')).toContain('Não foi possível')
  })
})
