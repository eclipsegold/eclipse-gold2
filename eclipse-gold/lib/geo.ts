import type { Country } from './currency'

export const DEFAULT_COUNTRY: Country = 'CH'

export function countryFromHeader(value: string | null | undefined): Country {
  if (!value) return DEFAULT_COUNTRY
  return value.toUpperCase()
}
