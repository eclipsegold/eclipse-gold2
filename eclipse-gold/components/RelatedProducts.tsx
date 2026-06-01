import type { Lang } from '../data/types'
import { collectionSlugFor } from '../lib/i18n'
import { getAllModels } from '../data/queries'
import { CollectionGrid } from './CollectionGrid'
import { ProductCard } from './ProductCard'
import { Price } from './Price'
import styles from './RelatedProducts.module.css'

export function RelatedProducts({
  lang,
  currentHandle,
  heading,
}: {
  lang: Lang
  currentHandle: string
  heading: string
}) {
  const related = getAllModels()
    .filter((m) => m.handle !== currentHandle)
    .slice(0, 4)

  if (related.length === 0) return null

  return (
    <section className={styles.related} aria-label={heading}>
      <h2 className={styles.heading}>{heading}</h2>
      <CollectionGrid>
        {related.map((m) => (
          <ProductCard
            key={m.handle}
            href={`/${lang}/${collectionSlugFor(lang)}/${m.slug[lang]}`}
            modelName={m.modelName}
            tagline={m.tagline[lang]}
            phenomenon={m.phenomenon}
            image={m.image ? { url: m.image, alt: m.modelName } : null}
            price={<Price handle={m.handle} lang={lang} defaultAmount="49.90" defaultCurrency="CHF" />}
          />
        ))}
      </CollectionGrid>
    </section>
  )
}
