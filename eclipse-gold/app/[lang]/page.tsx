import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLang, collectionSlugFor } from '../../lib/i18n'
import { collectionHub } from '../../data/collection'
import { getAllModels } from '../../data/queries'
import { buildMetadata } from '../../lib/seo/metadata'
import { Reveal } from '../../components/Reveal'
import { CollectionGrid } from '../../components/CollectionGrid'
import { ProductCard } from '../../components/ProductCard'
import { Price } from '../../components/Price'
import type { Lang } from '../../data/types'
import styles from './home.module.css'

function homePaths(): Record<Lang, string> {
  return { fr: '/fr', de: '/de', it: '/it' }
}

const FEATURED_HANDLES = ['totalis', 'nebula', 'penumbra'] as const

interface HomeCopy {
  heroSubtitle: string
  heroCta: string
  s1Body: string
  s2Kicker: string
  s2Heading: string
  s2Body: string
  featuredKicker: string
  featuredHeading: string
  reassurance: [string, string, string]
}

const COPY: Record<Lang, HomeCopy> = {
  fr: {
    heroSubtitle: 'Lunettes de soleil rimless or',
    heroCta: 'Découvrir la collection',
    s1Body:
      'Dix montures rimless or, inspirées des phénomènes du ciel. Chaque éclat capte la lumière comme une éclipse.',
    s2Kicker: 'Le geste solaire',
    s2Heading: "L'or, sans la monture",
    s2Body:
      "Des verres UV400 suspendus à une ligne d'or presque invisible. Une présence minimale, un éclat maximal — pensé pour la lumière du Sud.",
    featuredKicker: 'Les éclats',
    featuredHeading: 'Modèles phares',
    reassurance: ['Livraison offerte', 'Retours 14 jours', 'Paiement sécurisé'],
  },
  de: {
    heroSubtitle: 'Randlose Sonnenbrillen in Gold',
    heroCta: 'Kollektion entdecken',
    s1Body:
      'Zehn randlose Gold-Fassungen, inspiriert von den Phänomenen des Himmels. Jeder Lichtblitz fängt das Licht ein wie eine Finsternis.',
    s2Kicker: 'Die solare Geste',
    s2Heading: 'Gold, ohne Fassung',
    s2Body:
      'UV400-Gläser, gehalten von einer fast unsichtbaren Goldlinie. Minimale Präsenz, maximaler Glanz — gemacht für das Licht des Südens.',
    featuredKicker: 'Die Lichtblitze',
    featuredHeading: 'Highlight-Modelle',
    reassurance: ['Gratis Versand', '14 Tage Rückgabe', 'Sichere Zahlung'],
  },
  it: {
    heroSubtitle: 'Occhiali da sole senza montatura oro',
    heroCta: 'Scopri la collezione',
    s1Body:
      'Dieci montature rimless oro, ispirate ai fenomeni del cielo. Ogni bagliore cattura la luce come un’eclissi.',
    s2Kicker: 'Il gesto solare',
    s2Heading: "L'oro, senza montatura",
    s2Body:
      'Lenti UV400 sospese a una linea d’oro quasi invisibile. Presenza minima, bagliore massimo — pensato per la luce del Sud.',
    featuredKicker: 'I bagliori',
    featuredHeading: 'Modelli di punta',
    reassurance: ['Spedizione gratuita', 'Resi 14 giorni', 'Pagamento sicuro'],
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLang(lang)) return {}
  return buildMetadata({
    lang,
    pathByLang: homePaths(),
    title: collectionHub.seoTitle[lang],
    description: collectionHub.metaDescription[lang],
  })
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()

  const collectionHref = `/${lang}/${collectionSlugFor(lang)}`
  const t = COPY[lang]
  const featured = FEATURED_HANDLES.map((h) => getAllModels().find((m) => m.handle === h)).filter(
    (m): m is NonNullable<typeof m> => Boolean(m),
  )

  return (
    <>
      <section className={styles.hero}>
        <video
          className={styles.heroVideo}
          autoPlay
          muted
          loop
          playsInline
          poster="/images/hero/water.png"
        >
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Eclipse Gold</h1>
          <p className={styles.heroSubtitle}>{t.heroSubtitle}</p>
          <Link href={collectionHref} className={styles.heroCta}>
            {t.heroCta}
          </Link>
        </div>
      </section>

      <Reveal>
        <section className={styles.editorial}>
          <div className={styles.editorialMedia}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/hero/fire.png" alt="Lunettes Eclipse Gold dans la lumière du feu" loading="lazy" />
          </div>
          <div className={styles.editorialText}>
            <h2 className={styles.editorialHeading}>Wear the Sun</h2>
            <p className={styles.editorialBody}>{t.s1Body}</p>
            <Link href={collectionHref} className={styles.editorialLink}>
              {t.heroCta}
            </Link>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className={`${styles.editorial} ${styles.editorialReverse}`}>
          <div className={styles.editorialMedia}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/hero/sand.png" alt="Lunettes Eclipse Gold sur un tourbillon de sable doré" loading="lazy" />
          </div>
          <div className={styles.editorialText}>
            <p className={styles.editorialKicker}>{t.s2Kicker}</p>
            <h2 className={styles.editorialHeading}>{t.s2Heading}</h2>
            <p className={styles.editorialBody}>{t.s2Body}</p>
          </div>
        </section>
      </Reveal>

      <section className={styles.featured}>
        <header className={styles.featuredHead}>
          <p className={styles.editorialKicker}>{t.featuredKicker}</p>
          <h2 className={styles.featuredHeading}>{t.featuredHeading}</h2>
        </header>
        <CollectionGrid>
          {featured.map((m) => (
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

      <section className={styles.reassurance} aria-label="Garanties">
        <div className={styles.reassuranceInner}>
          {t.reassurance.map((label) => (
            <span key={label} className={styles.reassuranceItem}>
              <span className={styles.reassuranceMark} aria-hidden="true">✦</span>
              {label}
            </span>
          ))}
        </div>
      </section>
    </>
  )
}
