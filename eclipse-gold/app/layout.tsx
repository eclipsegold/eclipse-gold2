import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { JsonLd } from '../components/JsonLd'
import { organizationJsonLd, websiteJsonLd } from '../lib/seo/jsonld'
import { Analytics } from '../components/Analytics'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eclipse-gold-store.netlify.app',
  ),
  title: { default: 'Eclipse Gold', template: '%s | Eclipse Gold' },
  description: 'Lunettes de soleil rimless or, inspirées des phénomènes astronomiques.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon',
  },
  openGraph: {
    siteName: 'Eclipse Gold',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
