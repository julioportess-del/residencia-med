'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

/**
 * Tabela de desempenho — por enquanto 1 nível (especialidade). Na próxima
 * onda vira hierárquica (Especialidade → Tema → sub-tema) quando o endpoint
 * `dashboard.porTema` for adicionado.
 */
export function DesempenhoCliente() {
  const porEsp = trpc.dashboard.porEspecialidade.useQuery()
  const [busca, setBusca] = useState('')

  const filtrado = useMemo(() => {
    if (!porEsp.data) return []
    const q = busca.trim().toLowerCase()
    const base = q ? porEsp.data.filter((e) => e.nome.toLowerCase().includes(q)) : porEsp.data
    return base
  }, [porEsp.data, busca])

  return (
    <div className="mt-6 space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filtrar por especialidade"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-8"
        />
      </div>
      <Card>
        <CardContent className="p-0">
          {porEsp.isLoading ? (
            <div className="p-6">
              <Skeleton className="h-40" />
            </div>
          ) : filtrado.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              {busca
                ? 'Nenhuma especialidade combina com a busca.'
                : 'Responda algumas questões para começar a aparecer dados aqui.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Especialidade</th>
                    <th className="px-4 py-2 text-right">Respondidas</th>
                    <th className="px-4 py-2 text-right">Acertos</th>
                    <th className="px-4 py-2 text-right">Erros</th>
                    <th className="px-4 py-2 text-right">% Acerto</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrado.map((e) => (
                    <tr key={e.nome} className="border-b last:border-0">
                      <td className="px-4 py-2.5 font-medium">{e.nome}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{e.total}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600">
                        {e.acertos}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-rose-600">
                        {e.total - e.acertos}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold">
                        {Math.round(e.taxa * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Hierarquia por tema (Especialidade → Tema → sub-tema) chega na próxima iteração.
      </p>
    </div>
  )
}
