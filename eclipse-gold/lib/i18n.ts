import { LANGS, type Lang, type Localized, LEGAL_PAGES, type LegalPage } from '../data/types'

export { LANGS }
export type { Lang }

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value)
}

export const COLLECTION_SLUG: Localized<string> = {
  fr: 'lunettes-de-soleil-rimless-or',
  de: 'randlose-sonnenbrillen-gold',
  it: 'occhiali-da-sole-senza-montatura-oro',
}

export function collectionSlugFor(lang: Lang): string {
  return COLLECTION_SLUG[lang]
}

export function langForCollectionSlug(slug: string): Lang | undefined {
  return LANGS.find((l) => COLLECTION_SLUG[l] === slug)
}

export const LEGAL_SLUGS: Record<LegalPage, Localized<string>> = {
  terms:    { fr: 'cgv',              de: 'agb',              it: 'condizioni-vendita' },
  legal:    { fr: 'mentions-legales', de: 'impressum',       it: 'note-legali' },
  shipping: { fr: 'livraison',        de: 'versand',         it: 'spedizioni' },
  returns:  { fr: 'retours',          de: 'ruckgabe',        it: 'resi' },
  privacy:  { fr: 'confidentialite',  de: 'datenschutz',     it: 'privacy' },
  cookies:  { fr: 'cookies',          de: 'cookies',         it: 'cookie' },
}

export function legalSlugFor(page: LegalPage, lang: Lang): string {
  return LEGAL_SLUGS[page][lang]
}

export function legalPageForSlug(slug: string, lang: Lang): LegalPage | undefined {
  return LEGAL_PAGES.find((page) => LEGAL_SLUGS[page][lang] === slug)
}
