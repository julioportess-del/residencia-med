'use client'

import { useState, useTransition } from 'react'
import { Check, Stethoscope } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { Alert } from '@/components/ui/alert'
import { salvarExameFisico } from '@/server/actions'

/**
 * Campo de texto livre para o médico ESCREVER os achados do exame físico.
 * As sugestões da IA aparecem apenas como dica acima do campo — nunca
 * entram no prontuário. Salvar atualiza a estrutura clínica e regenera
 * o texto das evoluções.
 */

interface ExameFisicoEditorProps {
  consultaId: string
  inicial: string
  sugestoes: string[]
}

export function ExameFisicoEditor({ consultaId, inicial, sugestoes }: ExameFisicoEditorProps) {
  const [texto, setTexto] = useState(inicial)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciarTransicao] = useTransition()

  function salvar() {
    setErro(null)
    setSalvo(false)
    iniciarTransicao(async () => {
      const res = await salvarExameFisico(consultaId, texto)
      if (!res.ok) {
        setErro(res.erro)
        return
      }
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2500)
    })
  }

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Exame físico</h3>
      </div>

      {sugestoes.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Sugestões da IA para este caso (apenas lembrete — escreva só o que você avaliou):{' '}
          {sugestoes.join(' · ')}
        </p>
      ) : null}

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={4}
        maxLength={4000}
        placeholder="Escreva aqui os achados do exame físico (ex.: BEG, corado, hidratado. ACV: RCR 2T BNF sem sopros. AP: MV+ sem RA...)"
        className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {erro ? <Alert variant="destructive">{erro}</Alert> : null}

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={salvar} loading={pendente} disabled={pendente}>
          {salvo ? <Check className="h-4 w-4" /> : null}
          {salvo ? 'Salvo no prontuário' : 'Salvar exame físico'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Entra na seção EXAME FÍSICO da evolução e nas áreas copiáveis.
        </p>
      </div>
    </div>
  )
}
