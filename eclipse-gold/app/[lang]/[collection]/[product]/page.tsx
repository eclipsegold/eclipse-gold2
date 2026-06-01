import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LANGS, type Lang } from '../../../../data/types'
import { isLang, collectionSlugFor, COLLECTION_SLUG } from '../../../../lib/i18n'
import { getAllModels, getModelBySlug } from '../../../../data/queries'
import { getCatalogProduct } from '../../../../data/catalog'
import { buildMetadata, abs } from '../../../../lib/seo/metadata'
import { productJsonLd, breadcrumbJsonLd } from '../../../../lib/seo/jsonld'
import { currencyFor } from '../../../../lib/currency'
import { DEFAULT_COUNTRY } from '../../../../lib/geo'
import { JsonLd } from '../../../../components/JsonLd'
import { ProductGallery } from '../../../../components/ProductGallery'
import { Breadcrumbs } from '../../../../components/Breadcrumbs'
import { Price } from '../../../../components/Price'
import { AddToCartButton } from '../../../../components/AddToCartButton'
import { RelatedProducts } from '../../../../components/RelatedProducts'
import styles from './product.module.css'

export const revalidate = 3600

interface PdpCopy {
  shipping: string
  cta: string
  guarantee: [string, string, string]
  relatedHeading: string
}

const PDP: Record<Lang, PdpCopy> = {
  fr: {
    shipping: 'Préparation sous 48h · Livraison 7–21 jours ouvrés',
    cta: 'Commander maintenant',
    guarantee: ['Livraison offerte', 'Retours 14j', 'Paiement sécurisé'],
    relatedHeading: 'Autres modèles',
  },
  de: {
    shipping: 'Bearbeitung in 48 Std. · Lieferung 7–21 Werktage',
    cta: 'Jetzt bestellen',
    guarantee: ['Gratis Versand', 'Rückgabe 14 Tage', 'Sichere Zahlung'],
    relatedHeading: 'Weitere Modelle',
  },
  it: {
    shipping: 'Preparazione in 48h · Consegna 7–21 giorni lavorativi',
    cta: 'Ordina ora',
    guarantee: ['Spedizione gratuita', 'Resi 14g', 'Pagamento sicuro'],
    relatedHeading: 'Altri modelli',
  },
}

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

  const catalog = getCatalogProduct(model.handle, DEFAULT_COUNTRY)
  const t = PDP[lang]
  const defaultCurrency = currencyFor(lang, DEFAULT_COUNTRY)
  const defaultAmount = catalog?.price.amount ?? '49.90'
  const available = catalog ? catalog.availableForSale : true
  // Each product shows only its own curated photo. The hero lifestyle shots
  // (fire/sand/water) live on the home page only.
  const images = model.image ? [{ url: model.image, alt: model.modelName }] : []
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
          availability: catalog?.availableForSale ?? false,
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

        <div className={styles.purchase}>
          <Price
            handle={model.handle}
            lang={lang}
            defaultAmount={defaultAmount}
            defaultCurrency={defaultCurrency}
            size="lg"
          />
          <p className={styles.shipping}>{t.shipping}</p>
          <AddToCartButton handle={model.handle} available={available} label={t.cta} size="lg" lang={lang} />
          <ul className={styles.guarantee}>
            {t.guarantee.map((g) => (
              <li key={g}>
                <span className={styles.check} aria-hidden="true">✓</span> {g}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <RelatedProducts lang={lang} currentHandle={model.handle} heading={t.relatedHeading} />
    </article>
  )
}
