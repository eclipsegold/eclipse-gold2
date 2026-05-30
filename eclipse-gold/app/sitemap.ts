import type { MetadataRoute } from 'next'
import { LANGS } from '../data/types'
import { getAllModels } from '../data/queries'
import { COLLECTION_SLUG } from '../lib/i18n'
import { abs } from '../lib/seo/metadata'

export async function generateSitemaps() {
  return [{ id: 'products' }, { id: 'collection' }, { id: 'static' }]
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  // Next 16 passes `id` as a Promise — must await before comparing, otherwise
  // every split silently falls through to the products branch.
  const id = await props.id
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
