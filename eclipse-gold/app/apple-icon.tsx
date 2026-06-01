import { ImageResponse } from 'next/og'

// iOS home-screen icon, generated to match the brand (black + gold serif "E").
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
          background: 'radial-gradient(circle at 50% 35%, #1a1407 0%, #000 70%)',
          color: '#d4af37',
          fontSize: 120,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 600,
          letterSpacing: '-2px',
        }}
      >
        E
      </div>
    ),
    size,
  )
}
