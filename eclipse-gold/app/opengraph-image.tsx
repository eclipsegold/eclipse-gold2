import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Auto-populates og:image + twitter image site-wide (resolved via metadataBase).
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at 50% 40%, #1a1407 0%, #000 62%)',
          color: '#d4af37',
        }}
      >
        <div
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 120,
            fontWeight: 600,
            letterSpacing: 12,
            textTransform: 'uppercase',
            display: 'flex',
          }}
        >
          Eclipse Gold
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 34,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: '#9a9a9a',
            display: 'flex',
          }}
        >
          Lunettes de soleil rimless or
        </div>
      </div>
    ),
    { ...size },
  )
}
