import { describe, it, expect } from 'vitest'
import { legalSlugFor, legalPageForSlug, LANGS } from '../lib/i18n'
import { LEGAL_PAGES } from '../data/types'

describe('legal slug round-trip', () => {
  it('maps each (page, lang) to a slug and back', () => {
    for (const page of LEGAL_PAGES) {
      for (const lang of LANGS) {
        expect(legalPageForSlug(legalSlugFor(page, lang), lang)).toBe(page)
      }
    }
  })

  it('returns undefined for an unknown slug', () => {
    expect(legalPageForSlug('nope', 'fr')).toBeUndefined()
  })

  it('resolves a slug only within its own language', () => {
    expect(legalPageForSlug('impressum', 'de')).toBe('legal')
    expect(legalPageForSlug('impressum', 'fr')).toBeUndefined()
  })
})
