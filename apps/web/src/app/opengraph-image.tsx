import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Residência Med'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 64,
        background: 'linear-gradient(135deg, #3e7a72 0%, #4a8a81 50%, #2f5f59 100%)',
        color: 'white',
        fontFamily: 'system-ui',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}
        >
          🩺
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>Residência Med</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 1000,
          }}
        >
          Aprovação em residência, acelerada por dados.
        </div>
        <div
          style={{
            fontSize: 28,
            opacity: 0.92,
            lineHeight: 1.4,
            maxWidth: 900,
          }}
        >
          Análise de 10 anos da sua banca, plano adaptativo, repetição espaçada e cada erro
          explicado com guideline.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {['AMRIGS', 'ENARE', 'USP', 'UNIFESP', 'UNICAMP', 'PSU-MG', 'IPSEMG', 'HCPA'].map((b) => (
          <div
            key={b}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.16)',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {b}
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  )
}
