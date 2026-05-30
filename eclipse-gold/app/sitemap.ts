import type { MetadataRoute } from 'next'
import { LANGS } from '../data/types'
import { getAllModels } from '../data/queries'
import { COLLECTION_SLUG } from '../lib/i18n'
import { abs } from '../lib/seo/metadata'

export async function generateSitemaps() {
  return [{ id: 'products' }, { id: 'collection' }, { id: 'static' }]
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  if (id === 'static') {
    return LANGS.map((lang) => ({ url: abs(`/${lang}`), changeFrequency: 'monthly' as const, priority: 0.8 }))
  }
  if (id === 'collection') {
    return LANGS.map((lang) => ({
      url: abs(`/${lang}/${COLLECTION_SLUG[lang]}`),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }))
  }
  return LANGS.flatMap((lang) =>
    getAllModels().map((m) => ({
      url: abs(`/${lang}/${COLLECTION_SLUG[lang]}/${m.slug[lang]}`),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  )
}
