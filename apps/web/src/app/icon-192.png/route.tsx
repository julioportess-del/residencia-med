import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'
export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #3e7a72, #2f5f59)',
        color: '#fff',
        fontSize: 120,
        fontWeight: 900,
        fontFamily: 'system-ui',
      }}
    >
      R
    </div>,
    { width: 192, height: 192 },
  )
}
