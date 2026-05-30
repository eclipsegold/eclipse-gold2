import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { JsonLd } from '../components/JsonLd'
import { organizationJsonLd, websiteJsonLd } from '../lib/seo/jsonld'

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
  title: { default: 'Eclipse Gold', template: '%s | Eclipse Gold' },
  description: 'Lunettes de soleil rimless or, inspirées des phénomènes astronomiques.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        {children}
      </body>
    </html>
  )
}
