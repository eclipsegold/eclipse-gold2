import { describe, it, expect } from 'vitest'
import { currencyForCountry, currencyFor, formatPrice } from '../lib/currency'

describe('currency', () => {
  it('maps country to currency', () => {
    expect(currencyForCountry('CH')).toBe('CHF')
    expect(currencyForCountry('FR')).toBe('EUR')
    expect(currencyForCountry('BE')).toBe('EUR')
  })

  it('forces CHF for de/it regardless of country, geo-resolves for fr', () => {
    expect(currencyFor('de', 'FR')).toBe('CHF')
    expect(currencyFor('it', 'FR')).toBe('CHF')
    expect(currencyFor('fr', 'CH')).toBe('CHF')
    expect(currencyFor('fr', 'FR')).toBe('EUR')
  })

  it('formats a price with the right symbol and locale', () => {
    expect(formatPrice('49.90', 'CHF', 'fr')).toContain('49')
    expect(formatPrice('49.90', 'CHF', 'fr')).toMatch(/CHF/)
    expect(formatPrice('52.00', 'EUR', 'fr')).toMatch(/€|EUR/)
  })
})
