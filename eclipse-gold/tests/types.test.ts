import { describe, it, expect } from 'vitest'
import { LANGS, LOCALES, langFromLocale, currencyFromLocale } from '../data/types'

describe('locale helpers', () => {
  it('declares exactly three content languages', () => {
    expect(LANGS).toEqual(['fr', 'de', 'it'])
  })

  it('declares all five locales', () => {
    expect(LOCALES).toEqual(['fr-CH', 'de-CH', 'it-CH', 'fr-FR', 'fr'])
  })

  it('maps a locale to its content language', () => {
    expect(langFromLocale('de-CH')).toBe('de')
    expect(langFromLocale('it-CH')).toBe('it')
    expect(langFromLocale('fr-FR')).toBe('fr')
    expect(langFromLocale('fr')).toBe('fr')
  })

  it('derives currency from the market (CH=CHF, else EUR)', () => {
    expect(currencyFromLocale('fr-CH')).toBe('CHF')
    expect(currencyFromLocale('de-CH')).toBe('CHF')
    expect(currencyFromLocale('fr-FR')).toBe('EUR')
    expect(currencyFromLocale('fr')).toBe('EUR')
  })
})
