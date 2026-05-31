export const LANGS = ['fr', 'de', 'it'] as const
export type Lang = (typeof LANGS)[number]

/** Forces all three content languages to be present at compile time. */
export type Localized<T> = Record<Lang, T>

export const LOCALES = ['fr-CH', 'de-CH', 'it-CH', 'fr-FR', 'fr'] as const
export type Locale = (typeof LOCALES)[number]

export type Currency = 'CHF' | 'EUR'

export type Shape =
  | 'oversize' | 'aviator' | 'round' | 'rectangular' | 'square' | 'cat-eye'

export type Phenomenon =
  | 'totality' | 'heliacal' | 'nebula' | 'umbra' | 'zenith'
  | 'syzygy' | 'penumbra' | 'parhelion' | 'equinox' | 'chroma'

export type Audience = 'femme' | 'homme' | 'unisexe'

export interface SunglassModel {
  // Identity & Shopify join (shared, untranslated)
  handle: string
  modelName: string
  phenomenon: Phenomenon
  order: number
  featured: boolean
  // Physical attributes (shared)
  shape: Shape
  audience: Audience
  polarized: boolean
  lensTint: string
  /** Product photo under /public, e.g. '/images/products/totalis.png'. Optional. */
  image?: string
  // SEO & content (translated)
  slug: Localized<string>
  primaryKeyword: Localized<string>
  seoTitle: Localized<string>
  metaDescription: Localized<string>
  tagline: Localized<string>
  intro: Localized<string>
  features: Localized<string[]>
}

export interface CollectionHub {
  seoTitle: Localized<string>
  metaDescription: Localized<string>
  intro: Localized<string>
  modelOrder: string[]
}

export function langFromLocale(locale: Locale): Lang {
  if (locale.startsWith('de')) return 'de'
  if (locale.startsWith('it')) return 'it'
  return 'fr'
}

export function currencyFromLocale(locale: Locale): Currency {
  return locale.endsWith('CH') ? 'CHF' : 'EUR'
}

// --- Trust pages (sub-project E) ---

export const LEGAL_PAGES = [
  'terms', 'legal', 'shipping', 'returns', 'privacy', 'cookies',
] as const
export type LegalPage = (typeof LEGAL_PAGES)[number]

/** Written once, referenced in page content via {token} interpolation. */
export interface LegalEntity {
  companyName: string
  legalForm: string
  address: string[]
  country: string
  vatId: string
  registrationId: string
  email: string
  privacyEmail: string
  publisher: string
  host: string[]
}

export interface LegalSection {
  heading: Localized<string>
  body: Localized<string[]>
  bullets?: Localized<string[]>
}

export interface LegalPageContent {
  slug: Localized<string>
  seoTitle: Localized<string>
  metaDescription: Localized<string>
  title: Localized<string>
  intro: Localized<string>
  sections: LegalSection[]
  updatedAt: string
}
