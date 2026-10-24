'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { ProcessoSeletivoInput } from '@residencia-med/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/lib/trpc/client'
import { paraInput, type ProcessoListado } from './tipos'

type Campos = {
  instituicao: string
  bancaId: string
  especialidade: string
  numeroInscricao: string
  editalPublicado: boolean
  linkEdital: string
  inscricaoFeita: boolean
  inscricaoPaga: boolean
  taxa: string
  logisticaOrganizada: boolean
  cidadeProva: string
  inicioInscricoes: string
  fimInscricoes: string
  dataProva: string
  provaRealizada: boolean
  acertos: string
  totalQuestoes: string
  observacoes: string
}

const VAZIO: Campos = {
  instituicao: '',
  bancaId: '',
  especialidade: '',
  numeroInscricao: '',
  editalPublicado: false,
  linkEdital: '',
  inscricaoFeita: false,
  inscricaoPaga: false,
  taxa: '',
  logisticaOrganizada: false,
  cidadeProva: '',
  inicioInscricoes: '',
  fimInscricoes: '',
  dataProva: '',
  provaRealizada: false,
  acertos: '',
  totalQuestoes: '',
  observacoes: '',
}

function camposDe(p: ProcessoListado | null): Campos {
  if (!p) return VAZIO
  const i = paraInput(p)
  return {
    ...i,
    bancaId: i.bancaId ?? '',
    numeroInscricao: i.numeroInscricao ?? '',
    linkEdital: i.linkEdital ?? '',
    taxa:
      i.taxaInscricaoCentavos === null
        ? ''
        : (i.taxaInscricaoCentavos / 100).toFixed(2).replace('.', ','),
    cidadeProva: i.cidadeProva ?? '',
    inicioInscricoes: i.inicioInscricoes ?? '',
    fimInscricoes: i.fimInscricoes ?? '',
    dataProva: i.dataProva ?? '',
    acertos: i.acertos === null ? '' : String(i.acertos),
    totalQuestoes: i.totalQuestoes === null ? '' : String(i.totalQuestoes),
    observacoes: i.observacoes ?? '',
  }
}

const inteiro = (s: string) => (s.trim() === '' ? null : Number(s))
const centavos = (s: string) => {
  const limpo = s.trim().replace(/\./g, '').replace(',', '.')
  return limpo === '' ? null : Math.round(Number(limpo) * 100)
}
const dataOuNull = (s: string) => (s === '' ? null : s)

export function ProcessoFormDialog({
  aberto,
  onFechar,
  processo,
}: {
  aberto: boolean
  onFechar: () => void
  processo: ProcessoListado | null
}) {
  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{processo ? 'Editar prova' : 'Adicionar prova'}</DialogTitle>
          <DialogDescription>
            Só instituição e especialidade são obrigatórias. Complete o resto conforme o processo
            avança.
          </DialogDescription>
        </DialogHeader>
        {/* key remonta o formulário ao trocar de processo */}
        <Formulario key={processo?.id ?? 'novo'} processo={processo} onFechar={onFechar} />
      </DialogContent>
    </Dialog>
  )
}

function Formulario({
  processo,
  onFechar,
}: {
  processo: ProcessoListado | null
  onFechar: () => void
}) {
  const [c, setC] = useState<Campos>(() => camposDe(processo))
  const [erro, setErro] = useState<string | null>(null)
  const utils = trpc.useUtils()
  const { data: bancas } = trpc.banca.listar.useQuery()

  const aoSalvar = async () => {
    await Promise.all([utils.minhasProvas.listar.invalidate(), utils.dashboard.hoje.invalidate()])
    toast.success(processo ? 'Prova atualizada' : 'Prova adicionada')
    onFechar()
  }
  const criar = trpc.minhasProvas.criar.useMutation({ onSuccess: aoSalvar })
  const atualizar = trpc.minhasProvas.atualizar.useMutation({ onSuccess: aoSalvar })
  const salvando = criar.isPending || atualizar.isPending

  const set = <K extends keyof Campos>(k: K, v: Campos[K]) =>
    setC((atual) => ({ ...atual, [k]: v }))

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const resultado = ProcessoSeletivoInput.safeParse({
      instituicao: c.instituicao,
      bancaId: c.bancaId || null,
      especialidade: c.especialidade,
      numeroInscricao: c.numeroInscricao,
      editalPublicado: c.editalPublicado,
      linkEdital: c.linkEdital,
      inscricaoFeita: c.inscricaoFeita,
      inscricaoPaga: c.inscricaoPaga,
      taxaInscricaoCentavos: centavos(c.taxa),
      logisticaOrganizada: c.logisticaOrganizada,
      cidadeProva: c.cidadeProva,
      inicioInscricoes: dataOuNull(c.inicioInscricoes),
      fimInscricoes: dataOuNull(c.fimInscricoes),
      dataProva: dataOuNull(c.dataProva),
      provaRealizada: c.provaRealizada,
      acertos: inteiro(c.acertos),
      totalQuestoes: inteiro(c.totalQuestoes),
      observacoes: c.observacoes,
    })
    if (!resultado.success) {
      setErro(resultado.error.issues[0]?.message ?? 'Confira os campos')
      return
    }
    setErro(null)
    const onError = (err: { message: string }) => toast.error(err.message)
    if (processo) atualizar.mutate({ id: processo.id, dados: resultado.data }, { onError })
    else criar.mutate(resultado.data, { onError })
  }

  const escolherBanca = (id: string) => {
    const banca = bancas?.find((b) => b.id === id)
    setC((atual) => ({
      ...atual,
      bancaId: id,
      instituicao: atual.instituicao || banca?.codigo || '',
    }))
  }

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <Secao titulo="Processo">
        <Campo id="instituicao" rotulo="Instituição *">
          <Input
            id="instituicao"
            value={c.instituicao}
            onChange={(e) => set('instituicao', e.target.value)}
            placeholder="Ex.: HCPA, ENARE, USP"
            required
          />
        </Campo>
        <Campo id="especialidade" rotulo="Especialidade *">
          <Input
            id="especialidade"
            value={c.especialidade}
            onChange={(e) => set('especialidade', e.target.value)}
            placeholder="Ex.: Cirurgia Geral"
            required
          />
        </Campo>
        <Campo id="banca" rotulo="Banca (para estatísticas)">
          <select
            id="banca"
            value={c.bancaId}
            onChange={(e) => escolherBanca(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Nenhuma</option>
            {bancas?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome.startsWith(b.codigo) ? b.nome : `${b.codigo} — ${b.nome}`}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="numeroInscricao" rotulo="Nº de inscrição">
          <Input
            id="numeroInscricao"
            value={c.numeroInscricao}
            onChange={(e) => set('numeroInscricao', e.target.value)}
          />
        </Campo>
      </Secao>

      <Secao titulo="Edital e inscrição">
        <Check
          id="editalPublicado"
          rotulo="Edital publicado"
          valor={c.editalPublicado}
          onChange={(v) => set('editalPublicado', v)}
        />
        <Campo id="linkEdital" rotulo="Link do edital">
          <Input
            id="linkEdital"
            type="url"
            value={c.linkEdital}
            onChange={(e) => set('linkEdital', e.target.value)}
            placeholder="https://"
          />
        </Campo>
        <Campo id="inicioInscricoes" rotulo="Início das inscrições">
          <Input
            id="inicioInscricoes"
            type="date"
            value={c.inicioInscricoes}
            onChange={(e) => set('inicioInscricoes', e.target.value)}
          />
        </Campo>
        <Campo id="fimInscricoes" rotulo="Fim das inscrições">
          <Input
            id="fimInscricoes"
            type="date"
            value={c.fimInscricoes}
            onChange={(e) => set('fimInscricoes', e.target.value)}
          />
        </Campo>
        <Check
          id="inscricaoFeita"
          rotulo="Inscrição feita"
          valor={c.inscricaoFeita}
          onChange={(v) => set('inscricaoFeita', v)}
        />
        <Check
          id="inscricaoPaga"
          rotulo="Inscrição paga"
          valor={c.inscricaoPaga}
          onChange={(v) => set('inscricaoPaga', v)}
        />
        <Campo id="taxa" rotulo="Taxa de inscrição (R$)">
          <Input
            id="taxa"
            inputMode="decimal"
            value={c.taxa}
            onChange={(e) => set('taxa', e.target.value)}
            placeholder="0,00"
          />
        </Campo>
      </Secao>

      <Secao titulo="Prova">
        <Campo id="dataProva" rotulo="Data da prova">
          <Input
            id="dataProva"
            type="date"
            value={c.dataProva}
            onChange={(e) => set('dataProva', e.target.value)}
          />
        </Campo>
        <Campo id="cidadeProva" rotulo="Cidade da prova">
          <Input
            id="cidadeProva"
            value={c.cidadeProva}
            onChange={(e) => set('cidadeProva', e.target.value)}
          />
        </Campo>
        <Check
          id="logisticaOrganizada"
          rotulo="Logística organizada (viagem, hospedagem)"
          valor={c.logisticaOrganizada}
          onChange={(v) => set('logisticaOrganizada', v)}
        />
        <Check
          id="provaRealizada"
          rotulo="Prova realizada"
          valor={c.provaRealizada}
          onChange={(v) => set('provaRealizada', v)}
        />
        <Campo id="acertos" rotulo="Nº de acertos">
          <Input
            id="acertos"
            type="number"
            min={0}
            inputMode="numeric"
            value={c.acertos}
            onChange={(e) => set('acertos', e.target.value)}
          />
        </Campo>
        <Campo id="totalQuestoes" rotulo="Total de questões">
          <Input
            id="totalQuestoes"
            type="number"
            min={1}
            inputMode="numeric"
            value={c.totalQuestoes}
            onChange={(e) => set('totalQuestoes', e.target.value)}
          />
        </Campo>
      </Secao>

      <div className="space-y-1.5">
        <Label htmlFor="observacoes">Observações</Label>
        <textarea
          id="observacoes"
          value={c.observacoes}
          onChange={(e) => set('observacoes', e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Local de prova, documentos, contatos..."
        />
      </div>

      {erro && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {erro}
        </p>
      )}

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onFechar}>
          Cancelar
        </Button>
        <Button type="submit" loading={salvando}>
          {processo ? 'Salvar' : 'Adicionar'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

function Campo({ id, rotulo, children }: { id: string; rotulo: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      {children}
    </div>
  )
}

function Check({
  id,
  rotulo,
  valor,
  onChange,
}: {
  id: string
  rotulo: string
  valor: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition-colors hover:bg-accent has-[:checked]:border-primary/60 has-[:checked]:bg-primary/5"
    >
      <input
        id={id}
        type="checkbox"
        checked={valor}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[hsl(var(--primary))]"
      />
      {rotulo}
    </label>
  )
}
