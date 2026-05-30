import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LANGS, LEGAL_PAGES, type Lang } from '../../../../data/types'
import type { LegalPage } from '../../../../data/types'
import { isLang, legalSlugFor, legalPageForSlug } from '../../../../lib/i18n'
import { buildMetadata } from '../../../../lib/seo/metadata'
import { legalPages, legalEntity } from '../../../../data/legal'
import { LegalDocument } from '../../../../components/LegalDocument'

export const revalidate = 3600

export function generateStaticParams() {
  return LANGS.flatMap((lang) =>
    LEGAL_PAGES.map((page) => ({ lang, slug: legalSlugFor(page, lang) })),
  )
}

function legalPathsFor(page: LegalPage): Record<Lang, string> {
  return {
    fr: `/fr/infos/${legalSlugFor(page, 'fr')}`,
    de: `/de/infos/${legalSlugFor(page, 'de')}`,
    it: `/it/infos/${legalSlugFor(page, 'it')}`,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
  const { lang, slug } = await params
  if (!isLang(lang)) return {}
  const page = legalPageForSlug(slug, lang)
  if (!page) return {}
  const content = legalPages[page]
  return buildMetadata({
    lang,
    pathByLang: legalPathsFor(page),
    title: content.seoTitle[lang],
    description: content.metaDescription[lang],
  })
}

export default async function InfosPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  if (!isLang(lang)) notFound()
  const page = legalPageForSlug(slug, lang)
  if (!page) notFound()
  return <LegalDocument content={legalPages[page]} lang={lang} entity={legalEntity} />
}
