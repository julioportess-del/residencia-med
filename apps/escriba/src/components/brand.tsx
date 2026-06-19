interface LogoMarkProps {
  className?: string
}

/**
 * Marca do Escriba Health: onda de áudio que se transforma em um pulso clínico
 * (ECG) dentro de um quadrado arredondado com gradiente petróleo→teal.
 * Conceito: voz da consulta → sinal vital → documentação.
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="escriba-mark"
          x1="0"
          y1="0"
          x2="36"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#0E3A40" />
          <stop offset="1" stopColor="#16A394" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="10" fill="url(#escriba-mark)" />
      {/* onda de áudio à esquerda + pulso ECG no centro/direita */}
      <g
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M8 18 v-3.5" opacity="0.55" />
        <path d="M11.5 18 v-6.5" opacity="0.8" />
        <path d="M15 18 h2 l2 -7 l3 13 l2 -6 h3" />
      </g>
    </svg>
  )
}

interface BrandProps {
  compact?: boolean
  /** Texto claro para fundos escuros (painel institucional). */
  invert?: boolean
  className?: string
}

export function Brand({ compact = false, invert = false, className }: BrandProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 tracking-tight ${className ?? ''}`}>
      <LogoMark className="h-9 w-9 shrink-0" />
      {!compact && (
        <span className="text-lg font-semibold">
          <span className={invert ? 'text-white' : 'text-foreground'}>Escriba</span>{' '}
          <span
            className={invert ? 'font-normal text-white/70' : 'font-normal text-muted-foreground'}
          >
            Health
          </span>
        </span>
      )}
    </span>
  )
}
