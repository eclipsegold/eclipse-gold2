import type { Metadata } from 'next'
import { LANGS, type Lang, type Localized } from '../../data/types'

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eclipsegold.com'
}

export function abs(path: string): string {
  return `${siteUrl()}${path}`
}

export interface BuildMetadataArgs {
  lang: Lang
  pathByLang: Localized<string>
  title: string
  description: string
  /** Open Graph type. Defaults to 'website'; product pages can pass 'product'. */
  ogType?: 'website' | 'article' | 'product'
}

export function buildMetadata({
  lang,
  pathByLang,
  title,
  description,
  ogType = 'website',
}: BuildMetadataArgs): Metadata {
  const languages: Record<string, string> = {}
  for (const l of LANGS) languages[l] = abs(pathByLang[l])
  languages['x-default'] = abs(pathByLang.fr)

  return {
    title,
    description,
    alternates: {
      canonical: abs(pathByLang[lang]),
      languages,
    },
    openGraph: {
      title,
      description,
      url: abs(pathByLang[lang]),
      // Next's OpenGraph type union doesn't include 'product'; cast keeps the
      // public API flexible while emitting a valid og:type meta tag.
      type: ogType as 'website',
      locale: lang,
      siteName: 'Eclipse Gold',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    // og:image and twitter:image are populated automatically from
    // app/opengraph-image.tsx via metadataBase (set in the root layout).
  }
}
