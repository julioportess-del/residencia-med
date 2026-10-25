'use client'

import { Map } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Placeholder do Mapa Clínico — visualização de domínio por tema que será
 * populada na próxima onda. Por enquanto só comunica o que vem.
 */
export function MapaClinicoPlaceholder() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Map className="size-4" />
          Mapa Clínico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-1 sm:grid-cols-10 md:grid-cols-14">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-sm bg-muted/60"
              style={{ opacity: 0.3 + ((i * 37) % 100) / 200 }}
            />
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Heatmap de domínio por tema (iniciado · em progresso · consolidado) — chega na próxima
          onda, quando o perfil de proficiência passar a classificar tema a tema. Hoje a estimativa
          agregada aparece abaixo.
        </p>
      </CardContent>
    </Card>
  )
}
