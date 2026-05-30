import type { Metadata } from 'next'
import './globals.css'
import { JsonLd } from '../components/JsonLd'
import { organizationJsonLd, websiteJsonLd } from '../lib/seo/jsonld'

export const metadata: Metadata = {
  title: { default: 'Eclipse Gold', template: '%s | Eclipse Gold' },
  description: 'Lunettes de soleil rimless or, inspirées des phénomènes astronomiques.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        {children}
      </body>
    </html>
  )
}
