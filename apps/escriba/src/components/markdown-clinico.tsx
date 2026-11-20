import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renderização SEGURA do markdown gerado pela IA (respostas do assistente,
 * revisão de consulta, análise de anexos). Sem HTML arbitrário: o
 * react-markdown escapa HTML bruto por padrão (não usamos rehype-raw),
 * eliminando risco de XSS vindo do modelo ou de conteúdo externo.
 * Tabelas/listas/títulos via remark-gfm, com estilos do design system.
 */
export function MarkdownClinico({ texto }: { texto: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed [&>*:first-child]:mt-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h3 className="mt-4 text-base font-semibold text-foreground">{children}</h3>
          ),
          h2: ({ children }) => (
            <h4 className="mt-4 text-sm font-semibold text-foreground">{children}</h4>
          ),
          h3: ({ children }) => (
            <h5 className="mt-3 text-sm font-semibold text-foreground">{children}</h5>
          ),
          h4: ({ children }) => (
            <h6 className="mt-3 text-sm font-medium text-foreground">{children}</h6>
          ),
          p: ({ children }) => <p className="text-foreground/90">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="text-foreground/90">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/50 bg-primary/5 px-3 py-1.5 text-foreground/80">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted/60 px-2 py-1.5 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-2 py-1.5 align-top">{children}</td>
          ),
          hr: () => <hr className="my-3 border-border" />,
        }}
      >
        {texto}
      </ReactMarkdown>
    </div>
  )
}
