import type { MetadataRoute } from 'next'

// Served at /manifest.webmanifest (referenced from the root layout metadata).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Eclipse Gold',
    short_name: 'Eclipse Gold',
    description:
      'Lunettes de soleil rimless or, inspirées des phénomènes astronomiques.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
