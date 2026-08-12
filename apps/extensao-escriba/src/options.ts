/** Página de opções: concede a permissão de microfone para a extensão. */

export {}

const elStatus = document.getElementById('status') as HTMLParagraphElement

document.getElementById('permitir')?.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((t) => t.stop())
    elStatus.textContent = '✓ Microfone autorizado. Pode fechar esta aba e voltar ao Feegow.'
    elStatus.className = 'ok'
  } catch {
    elStatus.textContent =
      'Permissão negada. Clique no cadeado na barra de endereço e autorize o microfone.'
    elStatus.className = 'erro'
  }
})
