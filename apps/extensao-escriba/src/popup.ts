import { lerToken, validarConexao } from './api'

/** Popup: conectar (colar token) / status / atalhos. */

const elDesconectado = document.getElementById('desconectado') as HTMLDivElement
const elConectado = document.getElementById('conectado') as HTMLDivElement
const elToken = document.getElementById('token') as HTMLInputElement
const elMsg = document.getElementById('msg') as HTMLParagraphElement

function mostrar(conectado: boolean): void {
  elConectado.style.display = conectado ? 'block' : 'none'
  elDesconectado.style.display = conectado ? 'none' : 'block'
}

async function atualizar(): Promise<void> {
  const token = await lerToken()
  if (!token) {
    mostrar(false)
    return
  }
  try {
    await validarConexao()
    mostrar(true)
  } catch {
    mostrar(false)
    elMsg.textContent = 'Token inválido ou revogado — gere um novo nas Preferências.'
    elMsg.className = 'erro'
  }
}

document.getElementById('conectar')?.addEventListener('click', async () => {
  const token = elToken.value.trim()
  if (!token.startsWith('esc_')) {
    elMsg.textContent = 'Token inválido (começa com esc_).'
    elMsg.className = 'erro'
    return
  }
  await chrome.storage.local.set({ token })
  elMsg.textContent = 'Validando…'
  elMsg.className = ''
  try {
    await validarConexao()
    mostrar(true)
  } catch (e) {
    await chrome.storage.local.remove('token')
    elMsg.textContent = e instanceof Error ? e.message : 'Falha ao validar o token.'
    elMsg.className = 'erro'
  }
})

document.getElementById('desconectar')?.addEventListener('click', async () => {
  await chrome.storage.local.remove('token')
  mostrar(false)
})

document.getElementById('mic')?.addEventListener('click', () => {
  void chrome.runtime.openOptionsPage()
})

void atualizar()
