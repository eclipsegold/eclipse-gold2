import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLang, collectionSlugFor } from '../../lib/i18n'
import { collectionHub } from '../../data/collection'
import { buildMetadata } from '../../lib/seo/metadata'
import { Reveal } from '../../components/Reveal'
import type { Lang } from '../../data/types'
import styles from './home.module.css'

function homePaths(): Record<Lang, string> {
  return { fr: '/fr', de: '/de', it: '/it' }
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
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.ring} aria-hidden="true" />
        <h1 className={styles.title}>Wear the Sun</h1>
        <p className={styles.subtitle}>10 éclats · Lunettes rimless or</p>
        <Link href={collectionHref} className={styles.cta}>
          Découvrir la collection
        </Link>
      </section>
      <Reveal>
        <p className={styles.intro}>{collectionHub.intro[lang]}</p>
      </Reveal>
    </>
  )
}
