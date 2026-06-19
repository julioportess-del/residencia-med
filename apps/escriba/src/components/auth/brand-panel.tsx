import { ShieldCheck, Lock, AudioLines, FileText, Sparkles } from 'lucide-react'
import { Brand } from '@/components/brand'

const ESTATISTICAS = [
  { valor: '+10.000', rotulo: 'consultas transcritas' },
  { valor: '95%', rotulo: 'menos tempo documentando' },
]

const SELOS = [
  { icone: ShieldCheck, texto: 'LGPD Ready' },
  { icone: Lock, texto: 'Criptografia ponta a ponta' },
]

/** Painel institucional do login (desktop). Marca, proposta de valor e confiança. */
export function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-[#0b2a30] lg:flex lg:flex-col lg:justify-between lg:p-12 lg:text-white">
      {/* atmosfera: gradiente + brilhos sutis */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0b2a30] via-[#0e3a40] to-[#114f4c]" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#16a394]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[#0ea5a0]/10 blur-3xl" />

      <div className="relative">
        <Brand invert />
      </div>

      <div className="relative max-w-md space-y-8">
        <div className="space-y-4">
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight xl:text-[2.6rem]">
            Transforme consultas em documentação clínica em segundos.
          </h1>
          <p className="text-pretty text-base leading-relaxed text-white/70">
            Transcrição automática, evolução médica inteligente e prontuário assistido por IA — para
            você cuidar do paciente, não da papelada.
          </p>
        </div>

        <ProdutoMock />

        <dl className="flex gap-8">
          {ESTATISTICAS.map((e) => (
            <div key={e.rotulo}>
              <dt className="text-2xl font-semibold text-white xl:text-3xl">{e.valor}</dt>
              <dd className="text-sm text-white/60">{e.rotulo}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-2">
        {SELOS.map((s) => (
          <span key={s.texto} className="inline-flex items-center gap-2 text-sm text-white/70">
            <s.icone className="h-4 w-4 text-[#5fe3cf]" />
            {s.texto}
          </span>
        ))}
      </div>
    </aside>
  )
}

/** Mock ilustrativo do produto: onda de áudio → evolução gerada. */
function ProdutoMock() {
  return (
    <div className="animate-fade-in-up rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2 text-xs text-white/60">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#16a394]/30 text-[#7fe9d9]">
          <AudioLines className="h-3.5 w-3.5" />
        </span>
        Gravando consulta…
        <span className="ml-auto inline-flex items-center gap-1 text-[#7fe9d9]">
          <Sparkles className="h-3 w-3" /> IA
        </span>
      </div>

      {/* waveform animada */}
      <div className="flex h-10 items-center gap-1" aria-hidden="true">
        {WAVEFORM.map((h, i) => (
          <span
            key={i}
            className="w-1.5 rounded-full bg-[#5fe3cf]/80 animate-wave"
            style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>

      <div className="mt-3 space-y-2 rounded-lg bg-[#08222729] p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-white/80">
          <FileText className="h-3.5 w-3.5 text-[#7fe9d9]" />
          Evolução · SOAP
        </div>
        <div className="space-y-1.5">
          <div className="h-1.5 w-11/12 rounded-full bg-white/15" />
          <div className="h-1.5 w-9/12 rounded-full bg-white/15" />
          <div className="h-1.5 w-10/12 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  )
}

const WAVEFORM = [40, 70, 100, 60, 85, 45, 95, 55, 75, 35, 90, 50, 65, 80, 45]
