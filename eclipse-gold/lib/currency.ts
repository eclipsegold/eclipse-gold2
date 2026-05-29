import type { Lang } from '../data/types'

export type Country = 'CH' | 'FR' | (string & {})
export type Currency = 'CHF' | 'EUR'

export function currencyForCountry(country: Country): Currency {
  return country === 'CH' ? 'CHF' : 'EUR'
}

/** de/it target the Swiss audience (CHF); fr resolves by country. */
export function currencyFor(lang: Lang, country: Country): Currency {
  if (lang === 'de' || lang === 'it') return 'CHF'
  return currencyForCountry(country)
}

const INTL_LOCALE: Record<Lang, string> = { fr: 'fr-CH', de: 'de-CH', it: 'it-CH' }

export function formatPrice(amount: string, currency: Currency, lang: Lang): string {
  const value = Number(amount)
  return new Intl.NumberFormat(INTL_LOCALE[lang], {
    style: 'currency',
    currency,
  }).format(value)
}
