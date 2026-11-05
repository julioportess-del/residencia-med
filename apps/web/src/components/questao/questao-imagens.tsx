/** Figuras da questão (ECG, radiografia, foto, tabela em imagem), na ordem do enunciado. */
export function QuestaoImagens({ imagens }: { imagens: readonly string[] }) {
  if (imagens.length === 0) return null
  return (
    <div className="space-y-3">
      {imagens.map((url, i) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-lg border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Abrir figura em tamanho real"
        >
          <img
            src={url}
            alt={`Figura ${i + 1} da questão`}
            loading="lazy"
            className="mx-auto h-auto max-h-[70vh] w-auto max-w-full"
          />
        </a>
      ))}
    </div>
  )
}
