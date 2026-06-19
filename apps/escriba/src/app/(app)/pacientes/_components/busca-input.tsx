'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

/** Busca por nome — atualiza o query param `q` com debounce. */
export function BuscaInput({ inicial = '' }: { inicial?: string }) {
  const router = useRouter()
  const [valor, setValor] = useState(inicial)

  useEffect(() => {
    const t = setTimeout(() => {
      const q = valor.trim()
      router.replace(q ? `/pacientes?q=${encodeURIComponent(q)}` : '/pacientes')
    }, 300)
    return () => clearTimeout(t)
  }, [valor, router])

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Buscar paciente por nome…"
        className="pl-9"
        aria-label="Buscar paciente"
      />
    </div>
  )
}
