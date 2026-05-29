import { LANGS, type Lang, type Localized } from '../data/types'

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
