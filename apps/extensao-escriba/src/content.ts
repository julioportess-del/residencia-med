import { FEEGOW, TIPOS_ATENDIMENTO } from './config'
import type { EstadoExtensao, MensagemParaBg, Resposta, ResultadoConsulta } from './tipos'

/**
 * Widget flutuante do Escriba dentro do Feegow (app.feegow.com).
 * Shadow DOM para isolar estilos. Princípio: o médico não deve sentir que
 * está usando dois sistemas — grava, revisa e copia sem sair do prontuário.
 * A gravação em si vive no offscreen document (sobrevive a reload).
 */

const CSS = `
:host { all: initial; }
* { box-sizing: border-box; margin: 0; font-family: -apple-system, "Segoe UI", Roboto, sans-serif; }
.raiz { position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; }
.pill {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
  background: #0f766e; color: #fff; border: none; border-radius: 999px;
  padding: 10px 16px; font-size: 14px; font-weight: 600;
  box-shadow: 0 4px 16px rgba(0,0,0,.25);
}
.pill .rec { width: 8px; height: 8px; border-radius: 50%; background: #f87171; animation: pulsar 1.2s infinite; }
@keyframes pulsar { 50% { opacity: .35; } }
.card {
  width: 340px; max-height: 70vh; overflow-y: auto;
  background: #ffffff; color: #0f172a; border: 1px solid #e2e8f0;
  border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,.28);
  padding: 14px; display: flex; flex-direction: column; gap: 10px;
}
.topo { display: flex; align-items: center; justify-content: space-between; }
.titulo { font-size: 14px; font-weight: 700; color: #0f766e; }
.fechar { background: none; border: none; cursor: pointer; color: #64748b; font-size: 16px; }
label { font-size: 12px; color: #475569; display: block; margin-bottom: 3px; }
input[type="text"], select {
  width: 100%; height: 34px; border: 1px solid #cbd5e1; border-radius: 8px;
  padding: 0 10px; font-size: 13px; background: #fff; color: #0f172a;
}
.consent { display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: #334155;
  background: #f1f5f9; border-radius: 8px; padding: 8px; cursor: pointer; }
.consent input { margin-top: 2px; }
.botao {
  width: 100%; height: 38px; border: none; border-radius: 9px; cursor: pointer;
  font-size: 14px; font-weight: 600; background: #0f766e; color: #fff;
}
.botao[disabled] { opacity: .5; cursor: default; }
.botao.sec { background: #f1f5f9; color: #0f172a; }
.botao.perigo { background: #dc2626; }
.linha { display: flex; gap: 8px; }
.linha .botao { flex: 1; }
.timer { text-align: center; font-size: 30px; font-variant-numeric: tabular-nums; font-weight: 700; }
.gravando-txt { display:flex; align-items:center; justify-content:center; gap:6px;
  color: #dc2626; font-size: 12px; font-weight: 600; }
.gravando-txt .rec { width: 8px; height: 8px; border-radius: 50%; background: #dc2626; animation: pulsar 1.2s infinite; }
.status { font-size: 12px; color: #64748b; text-align: center; }
.erro { font-size: 12px; color: #dc2626; background: #fef2f2; border-radius: 8px; padding: 8px; }
.secao { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; }
.secao h4 { font-size: 12px; font-weight: 700; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; }
.secao pre { font-size: 12px; white-space: pre-wrap; color: #334155; max-height: 130px; overflow-y: auto; font-family: inherit; }
.copiar { background: #f1f5f9; border: none; border-radius: 6px; cursor: pointer;
  font-size: 11px; padding: 3px 8px; color: #0f766e; font-weight: 600; }
a.link { font-size: 12px; color: #0f766e; text-align: center; display: block; }
`

function detectarNomePaciente(): string {
  for (const seletor of FEEGOW.seletoresNomePaciente) {
    const el = document.querySelector(seletor)
    const texto = el?.textContent?.trim()
    if (texto && texto.length >= 3 && texto.length <= 120) return texto
  }
  return ''
}

async function bg<T>(msg: MensagemParaBg): Promise<Resposta<T>> {
  try {
    return (await chrome.runtime.sendMessage(msg)) as Resposta<T>
  } catch {
    return { ok: false, erro: 'Extensão recarregada — atualize a página.' }
  }
}

function formatarTempo(ms: number): string {
  const s = Math.floor(ms / 1000)
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

// ─── montagem ───

const host = document.createElement('div')
const shadow = host.attachShadow({ mode: 'closed' })
const estilo = document.createElement('style')
estilo.textContent = CSS
const raiz = document.createElement('div')
raiz.className = 'raiz'
shadow.append(estilo, raiz)
document.documentElement.append(host)

let aberto = false
let estadoAtual: EstadoExtensao = { estado: 'ocioso', msAcumulados: 0 }
let resultado: ResultadoConsulta | null = null
let erroLocal: string | null = null

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> & { texto?: string } = {},
  filhos: (HTMLElement | string)[] = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  const { texto, ...resto } = props
  Object.assign(el, resto)
  if (texto) el.textContent = texto
  el.append(...filhos)
  return el
}

function render(): void {
  raiz.replaceChildren()

  if (!aberto) {
    const gravando = estadoAtual.estado === 'gravando' || estadoAtual.estado === 'pausado'
    const pill = h('button', { className: 'pill', onclick: () => ((aberto = true), render()) })
    if (gravando) pill.append(h('span', { className: 'rec' }))
    pill.append(`🎙 Escriba${gravando ? ` · ${formatarTempo(tempoDecorrido())}` : ''}`)
    raiz.append(pill)
    return
  }

  const card = h('div', { className: 'card' })
  card.append(
    h('div', { className: 'topo' }, [
      h('span', { className: 'titulo', texto: '🎙 Escriba Health' }),
      h('button', {
        className: 'fechar',
        texto: '—',
        onclick: () => ((aberto = false), render()),
      }),
    ]),
  )

  if (erroLocal) card.append(h('div', { className: 'erro', texto: erroLocal }))

  switch (estadoAtual.estado) {
    case 'ocioso':
      renderFormulario(card)
      break
    case 'gravando':
    case 'pausado':
      renderGravacao(card)
      break
    case 'processando':
      renderProcessando(card)
      break
    case 'pronto':
      renderPronto(card)
      break
    case 'erro':
      card.append(
        h('div', { className: 'erro', texto: estadoAtual.erro ?? 'Falha no processamento.' }),
        h('button', {
          className: 'botao sec',
          texto: 'Recomeçar',
          onclick: () => void descartar(),
        }),
      )
      break
  }

  raiz.append(card)
}

function renderFormulario(card: HTMLElement): void {
  const nomeDetectado = detectarNomePaciente()
  const inputNome = h('input', {
    type: 'text',
    value: nomeDetectado,
    placeholder: 'Nome ou iniciais do paciente',
  })
  const selectTipo = h('select')
  for (const [valor, rotulo] of TIPOS_ATENDIMENTO) {
    selectTipo.append(h('option', { value: valor, texto: rotulo }))
  }
  const checkConsent = h('input', { type: 'checkbox' })
  const botao = h('button', { className: 'botao', texto: 'Iniciar consulta' })

  botao.onclick = async () => {
    erroLocal = null
    const nome = inputNome.value.trim()
    if (nome.length < 2) {
      erroLocal = 'Informe o nome (ou iniciais) do paciente.'
      render()
      return
    }
    if (!checkConsent.checked) {
      erroLocal = 'O consentimento do paciente é obrigatório.'
      render()
      return
    }
    botao.disabled = true
    const r = await bg<EstadoExtensao>({
      alvo: 'bg',
      tipo: 'INICIAR',
      paciente: nome,
      tipoAtendimento: selectTipo.value,
    })
    if (!r.ok) {
      erroLocal = r.erro
    } else {
      estadoAtual = r.dados
      resultado = null
    }
    render()
  }

  card.append(
    h('div', {}, [h('label', { texto: 'Paciente' }), inputNome]),
    nomeDetectado
      ? h('div', { className: 'status', texto: 'Detectado na tela — confira antes de iniciar.' })
      : h('div', {}),
    h('div', {}, [h('label', { texto: 'Tipo de atendimento' }), selectTipo]),
    h('label', { className: 'consent' }, [
      checkConsent,
      h('span', {
        texto:
          'Informei o paciente sobre a gravação e o uso para apoio ao prontuário, e ele consentiu.',
      }),
    ]),
    botao,
  )
}

function tempoDecorrido(): number {
  const base = estadoAtual.msAcumulados
  if (estadoAtual.estado === 'gravando' && estadoAtual.inicioEm) {
    return base + (Date.now() - estadoAtual.inicioEm)
  }
  return base
}

function renderGravacao(card: HTMLElement): void {
  const pausado = estadoAtual.estado === 'pausado'
  card.append(
    h('div', { className: 'status', texto: estadoAtual.paciente ?? '' }),
    h('div', { className: 'timer', texto: formatarTempo(tempoDecorrido()) }),
    pausado
      ? h('div', { className: 'status', texto: 'Pausado' })
      : h('div', { className: 'gravando-txt' }, [h('span', { className: 'rec' }), 'Gravando']),
    h('div', { className: 'linha' }, [
      h('button', {
        className: 'botao sec',
        texto: pausado ? 'Retomar' : 'Pausar',
        onclick: async () => {
          const r = await bg<EstadoExtensao>({ alvo: 'bg', tipo: pausado ? 'RETOMAR' : 'PAUSAR' })
          if (r.ok) estadoAtual = r.dados
          render()
        },
      }),
      h('button', {
        className: 'botao',
        texto: 'Finalizar',
        onclick: async () => {
          const r = await bg<EstadoExtensao>({ alvo: 'bg', tipo: 'FINALIZAR' })
          if (r.ok) estadoAtual = r.dados
          else erroLocal = r.erro
          render()
        },
      }),
    ]),
  )
}

function renderProcessando(card: HTMLElement): void {
  const fase =
    estadoAtual.fase === 'transcrevendo' && estadoAtual.progresso
      ? `Transcrevendo… (${estadoAtual.progresso.atual}/${estadoAtual.progresso.total})`
      : estadoAtual.fase === 'estruturando'
        ? 'Gerando o prontuário…'
        : 'Preparando o áudio…'
  card.append(
    h('div', { className: 'status', texto: estadoAtual.paciente ?? '' }),
    h('div', { className: 'timer', texto: '⏳' }),
    h('div', { className: 'status', texto: fase }),
  )
}

function renderPronto(card: HTMLElement): void {
  card.append(
    h('div', { className: 'status', texto: `✓ Prontuário pronto — revise antes de usar.` }),
  )

  if (!resultado) {
    card.append(h('div', { className: 'status', texto: 'Carregando revisão…' }))
    void carregarResultado()
    return
  }

  const addSecao = (titulo: string, texto: string) => {
    const botaoCopiar = h('button', { className: 'copiar', texto: 'Copiar' })
    botaoCopiar.onclick = async () => {
      await navigator.clipboard.writeText(texto)
      botaoCopiar.textContent = '✓ Copiado'
      setTimeout(() => (botaoCopiar.textContent = 'Copiar'), 1500)
    }
    card.append(
      h('div', { className: 'secao' }, [h('h4', {}, [titulo, botaoCopiar]), h('pre', { texto })]),
    )
  }

  if (resultado.prontuario) addSecao('Prontuário (SOAP)', resultado.prontuario)
  for (const s of resultado.secoes) addSecao(s.titulo, s.texto)

  const base = 'https://escriba-escriba.vercel.app'
  card.append(
    h('a', {
      className: 'link',
      texto: 'Editar no Escriba ↗',
      href: `${base}/consultas/${resultado.id}`,
      target: '_blank',
    }),
    h('button', {
      className: 'botao sec',
      texto: 'Nova consulta',
      onclick: () => void descartar(),
    }),
  )
}

async function carregarResultado(): Promise<void> {
  if (!estadoAtual.consultaId) return
  const r = await bg<ResultadoConsulta>({
    alvo: 'bg',
    tipo: 'BUSCAR_RESULTADO',
    consultaId: estadoAtual.consultaId,
  })
  if (r.ok) {
    resultado = r.dados
  } else {
    erroLocal = r.erro
  }
  render()
}

async function descartar(): Promise<void> {
  const r = await bg<EstadoExtensao>({ alvo: 'bg', tipo: 'DESCARTAR' })
  if (r.ok) estadoAtual = r.dados
  resultado = null
  erroLocal = null
  render()
}

// Sincroniza estado com o background: 1 s gravando/processando, 5 s parado.
async function sincronizar(): Promise<void> {
  const r = await bg<EstadoExtensao>({ alvo: 'bg', tipo: 'ESTADO' })
  if (r.ok) {
    const antes = JSON.stringify(estadoAtual)
    estadoAtual = r.dados
    if (JSON.stringify(estadoAtual) !== antes || estadoAtual.estado === 'gravando') render()
  }
}

void sincronizar().then(render)
setInterval(() => {
  const ativo =
    estadoAtual.estado === 'gravando' ||
    estadoAtual.estado === 'processando' ||
    estadoAtual.estado === 'pausado'
  if (ativo || Date.now() % 5000 < 1000) void sincronizar()
}, 1000)
