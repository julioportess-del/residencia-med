'use client'

import { AlertTriangle, BookMarked, Check, ExternalLink, FileText, Repeat2, X } from 'lucide-react'
import { interpretarConfianca, type NivelConfianca } from '@residencia-med/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExplicarComIA } from '@/components/explicar-ia-dialog'
import { RegistroErroForm } from '@/components/registro-erro-form'
import { cn } from '@/lib/cn'

type Correcao = {
  correta: boolean
  gabaritoLetra: string
  explicacaoMd: string
  explicacaoPendente: boolean
  fonte: string | null
  proximaRevisao: Date
  iaDisponivel: boolean
  alternativasErrosMd: Record<string, string>
}

type Props = {
  questaoId: string
  escolha: string
  confianca: NivelConfianca
  correcao: Correcao
  temas: Array<{ primario: boolean; tema: { id: string; nome: string } }>
  guidelines: Array<{
    trecho: string | null
    guideline: { titulo: string; fonte: string; url: string | null }
  }>
}

const formatoData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'America/Sao_Paulo',
})

const COR_GRAVIDADE = {
  alta: 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
  media: 'border-border bg-muted/40',
  baixa: 'border-border bg-muted/40',
} as const

export function CorrecaoPainel({
  questaoId,
  escolha,
  confianca,
  correcao,
  temas,
  guidelines,
}: Props) {
  const leitura = interpretarConfianca(confianca, correcao.correta)
  const comentariosAlternativas = Object.entries(correcao.alternativasErrosMd).filter(
    ([, texto]) => texto.trim().length > 0,
  )

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          correcao.correta
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
            : 'border-rose-500 bg-rose-50 dark:bg-rose-950/30',
        )}
      >
        <CardContent className="space-y-1 pt-6">
          <div className="flex items-center gap-2 font-semibold">
            {correcao.correta ? (
              <Check className="text-emerald-600" />
            ) : (
              <X className="text-rose-600" />
            )}
            {correcao.correta ? 'Resposta correta' : 'Resposta incorreta'}
          </div>
          <p className="text-sm">
            Sua resposta: <strong>{escolha}</strong> · Gabarito oficial:{' '}
            <strong>{correcao.gabaritoLetra}</strong>
          </p>
        </CardContent>
      </Card>

      <div className={cn('rounded-lg border p-4 text-sm', COR_GRAVIDADE[leitura.gravidade])}>
        <div className="flex items-center gap-2 font-medium">
          {leitura.gravidade === 'alta' && <AlertTriangle className="size-4" />}
          {leitura.titulo}
        </div>
        <p className="mt-1 text-muted-foreground">{leitura.orientacao}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Repeat2 className="size-3.5" />
          Próxima revisão desta questão: {formatoData.format(correcao.proximaRevisao)}
        </p>
      </div>

      {!correcao.correta && <RegistroErroForm questaoId={questaoId} />}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Comentário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          {correcao.explicacaoPendente ? (
            <p className="text-muted-foreground">
              Esta questão foi importada da prova oficial e ainda não tem comentário revisado. O
              gabarito acima é o oficial da banca.
            </p>
          ) : (
            <p className="whitespace-pre-line">{correcao.explicacaoMd}</p>
          )}

          {comentariosAlternativas.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Por que as outras alternativas estão erradas
              </div>
              <ul className="space-y-1.5">
                {comentariosAlternativas.map(([letra, texto]) => (
                  <li key={letra} className={cn(letra === escolha && 'font-medium')}>
                    <span className="mr-1.5 font-semibold">{letra})</span>
                    {texto}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {correcao.iaDisponivel && (
            <div className="border-t pt-3">
              <ExplicarComIA questaoId={questaoId} alternativaEscolhida={escolha} />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Conteúdo gerado por IA, não revisado — confira com a referência antes de confiar.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {(temas.length > 0 || guidelines.length > 0 || correcao.fonte) && (
        <Card>
          <CardContent className="space-y-3 pt-6 text-sm">
            {temas.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <BookMarked className="size-4 text-muted-foreground" />
                {temas.map((t) => (
                  <span
                    key={t.tema.id}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-xs',
                      t.primario && 'border-primary bg-primary/5 font-medium',
                    )}
                  >
                    {t.tema.nome}
                  </span>
                ))}
              </div>
            )}
            {guidelines.map((g) => (
              <div key={g.guideline.titulo} className="flex gap-2">
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {g.guideline.url ? (
                      <a
                        href={g.guideline.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline-offset-4 hover:underline"
                      >
                        {g.guideline.titulo}
                      </a>
                    ) : (
                      g.guideline.titulo
                    )}{' '}
                    <span className="text-xs text-muted-foreground">({g.guideline.fonte})</span>
                  </div>
                  {g.trecho && <p className="text-muted-foreground">{g.trecho}</p>}
                </div>
              </div>
            ))}
            {correcao.fonte && /^https?:\/\//.test(correcao.fonte) && (
              <a
                href={correcao.fonte}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                <ExternalLink className="size-3.5" />
                Prova original (PDF da banca)
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
