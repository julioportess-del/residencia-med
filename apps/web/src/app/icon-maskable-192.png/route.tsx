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
        background: '#3e7a72',
        color: '#fff',
        fontSize: 80,
        fontWeight: 900,
        fontFamily: 'system-ui',
      }}
    >
      R
    </div>,
    { width: 192, height: 192 },
  )
}
