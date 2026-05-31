import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LANGS, type Lang } from '../../../../data/types'
import { isLang, collectionSlugFor, COLLECTION_SLUG } from '../../../../lib/i18n'
import { getAllModels, getModelBySlug } from '../../../../data/queries'
import { getShopifyProduct } from '../../../../data/shopify'
import { buildMetadata, abs } from '../../../../lib/seo/metadata'
import { productJsonLd, breadcrumbJsonLd } from '../../../../lib/seo/jsonld'
import { currencyFor } from '../../../../lib/currency'
import { DEFAULT_COUNTRY } from '../../../../lib/geo'
import { JsonLd } from '../../../../components/JsonLd'
import { ProductGallery } from '../../../../components/ProductGallery'
import { Breadcrumbs } from '../../../../components/Breadcrumbs'
import { Price } from '../../../../components/Price'
import { AddToCartButton } from '../../../../components/AddToCartButton'
import styles from './product.module.css'

export const revalidate = 3600

export function generateStaticParams() {
  return LANGS.flatMap((lang) =>
    getAllModels().map((m) => ({
      lang,
      collection: COLLECTION_SLUG[lang],
      product: m.slug[lang],
    })),
  )
}

function productPaths(handle: string): Record<Lang, string> {
  const model = getAllModels().find((m) => m.handle === handle)!
  return {
    fr: `/fr/${COLLECTION_SLUG.fr}/${model.slug.fr}`,
    de: `/de/${COLLECTION_SLUG.de}/${model.slug.de}`,
    it: `/it/${COLLECTION_SLUG.it}/${model.slug.it}`,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; collection: string; product: string }>
}): Promise<Metadata> {
  const { lang, collection, product } = await params
  if (!isLang(lang) || collection !== collectionSlugFor(lang)) return {}
  const model = getModelBySlug(product, lang)
  if (!model) return {}
  return buildMetadata({
    lang,
    pathByLang: productPaths(model.handle),
    title: model.seoTitle[lang],
    description: model.metaDescription[lang],
  })
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ lang: string; collection: string; product: string }>
}) {
  const { lang, collection, product } = await params
  if (!isLang(lang) || collection !== collectionSlugFor(lang)) notFound()
  const model = getModelBySlug(product, lang)
  if (!model) notFound()

  let shopify: Awaited<ReturnType<typeof getShopifyProduct>> = null
  try {
    shopify = await getShopifyProduct(model.handle, DEFAULT_COUNTRY)
  } catch {
    shopify = null
  }
  const defaultCurrency = currencyFor(lang, DEFAULT_COUNTRY)
  const defaultAmount = shopify?.price.amount ?? '49.90'
  const shopifyImages = shopify?.images.map((i) => ({ url: i.url, alt: i.altText ?? model.modelName })) ?? []
  // The curated local product photo is the primary/hero image; Shopify images follow.
  const images = model.image
    ? [{ url: model.image, alt: model.modelName }, ...shopifyImages]
    : shopifyImages
  const url = abs(`/${lang}/${collectionSlugFor(lang)}/${model.slug[lang]}`)

  return (
    <article className={styles.article}>
      <JsonLd
        data={productJsonLd({
          name: model.modelName,
          description: model.metaDescription[lang],
          url,
          image: images.map((i) => (i.url.startsWith('http') ? i.url : abs(i.url))),
          price: defaultAmount,
          currency: defaultCurrency,
          availability: shopify?.availableForSale ?? false,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Eclipse Gold', url: abs(`/${lang}`) },
          { name: 'Collection', url: abs(`/${lang}/${collectionSlugFor(lang)}`) },
          { name: model.modelName, url },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: 'Accueil', href: `/${lang}` },
          { name: 'Collection', href: `/${lang}/${collectionSlugFor(lang)}` },
          { name: model.modelName, href: `/${lang}/${collectionSlugFor(lang)}/${model.slug[lang]}` },
        ]}
      />
      <ProductGallery images={images} />
      <div className={styles.body}>
        <p className={styles.phenomenon}>{model.phenomenon}</p>
        <h1 className={styles.name}>{model.modelName}</h1>
        <p className={styles.tagline}>{model.tagline[lang]}</p>
        <p className={styles.desc}>{model.intro[lang]}</p>
        <ul className={styles.features}>
          {model.features[lang].map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </div>
      <div className={styles.sticky}>
        {shopify ? (
          <Price handle={model.handle} lang={lang} defaultAmount={defaultAmount} defaultCurrency={defaultCurrency} />
        ) : (
          <span className={styles.unavailable}>Bientôt disponible</span>
        )}
        <AddToCartButton handle={model.handle} available={shopify?.availableForSale ?? false} />
      </div>
    </article>
  )
}
