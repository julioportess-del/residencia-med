/**
 * Skeleton global do grupo (app): aparece INSTANTANEAMENTE em qualquer
 * navegação enquanto o servidor busca os dados — o clique nunca fica "morto".
 */
export default function LoadingApp() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-40 animate-pulse rounded-xl border border-border bg-muted/50" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-xl border border-border bg-muted/50" />
        <div className="h-48 animate-pulse rounded-xl border border-border bg-muted/50" />
      </div>
    </div>
  )
}
