import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LANGS, type Lang } from '../../../data/types'
import { isLang, collectionSlugFor, COLLECTION_SLUG } from '../../../lib/i18n'
import { getAllModels } from '../../../data/queries'
import { collectionHub } from '../../../data/collection'
import { buildMetadata, abs } from '../../../lib/seo/metadata'
import { collectionJsonLd, breadcrumbJsonLd } from '../../../lib/seo/jsonld'
import { JsonLd } from '../../../components/JsonLd'
import { CollectionGrid } from '../../../components/CollectionGrid'
import { ProductCard } from '../../../components/ProductCard'
import styles from './collection.module.css'

export const revalidate = 3600

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang, collection: COLLECTION_SLUG[lang] }))
}

function collectionPaths(): Record<Lang, string> {
  return {
    fr: `/fr/${COLLECTION_SLUG.fr}`,
    de: `/de/${COLLECTION_SLUG.de}`,
    it: `/it/${COLLECTION_SLUG.it}`,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; collection: string }>
}): Promise<Metadata> {
  const { lang, collection } = await params
  if (!isLang(lang) || collection !== collectionSlugFor(lang)) return {}
  return buildMetadata({
    lang,
    pathByLang: collectionPaths(),
    title: collectionHub.seoTitle[lang],
    description: collectionHub.metaDescription[lang],
  })
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ lang: string; collection: string }>
}) {
  const { lang, collection } = await params
  if (!isLang(lang) || collection !== collectionSlugFor(lang)) notFound()

  const ordered = collectionHub.modelOrder
    .map((h) => getAllModels().find((m) => m.handle === h))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))

  const items = ordered.map((m) => ({
    name: m.modelName,
    url: abs(`/${lang}/${collectionSlugFor(lang)}/${m.slug[lang]}`),
  }))

  return (
    <section>
      <JsonLd data={collectionJsonLd(items)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Eclipse Gold', url: abs(`/${lang}`) },
          { name: collectionHub.seoTitle[lang], url: abs(`/${lang}/${collectionSlugFor(lang)}`) },
        ])}
      />
      <header className={styles.header}>
        <h1 className={styles.kicker}>La Collection</h1>
        <p className={styles.sub}>Dix éclats</p>
        <p className={styles.intro}>{collectionHub.intro[lang]}</p>
      </header>
      <CollectionGrid>
        {ordered.map((m) => (
          <ProductCard
            key={m.handle}
            href={`/${lang}/${collectionSlugFor(lang)}/${m.slug[lang]}`}
            modelName={m.modelName}
            tagline={m.tagline[lang]}
            phenomenon={m.phenomenon}
            image={null}
          />
        ))}
      </CollectionGrid>
    </section>
  )
}
