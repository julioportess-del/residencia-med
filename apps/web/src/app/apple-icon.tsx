import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
          color: '#fff',
          fontSize: 110,
          fontWeight: 900,
          fontFamily: 'system-ui',
        }}
      >
        R
      </div>
    ),
    { ...size },
  )
}
