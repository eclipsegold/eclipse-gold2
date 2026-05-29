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
}

export function buildMetadata({ lang, pathByLang, title, description }: BuildMetadataArgs): Metadata {
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
      type: 'website',
      locale: lang,
    },
  }
}
