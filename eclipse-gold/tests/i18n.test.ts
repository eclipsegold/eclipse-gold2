import { describe, it, expect } from 'vitest'
import { isLang, COLLECTION_SLUG, collectionSlugFor, langForCollectionSlug } from '../lib/i18n'

describe('i18n', () => {
  it('recognises valid langs', () => {
    expect(isLang('fr')).toBe(true)
    expect(isLang('de')).toBe(true)
    expect(isLang('en')).toBe(false)
    expect(isLang(undefined)).toBe(false)
  })

  it('maps lang to its collection slug', () => {
    expect(collectionSlugFor('fr')).toBe(COLLECTION_SLUG.fr)
    expect(COLLECTION_SLUG.fr).toBe('lunettes-de-soleil-rimless-or')
  })

  it('reverse-maps a collection slug to its lang', () => {
    expect(langForCollectionSlug(COLLECTION_SLUG.de)).toBe('de')
    expect(langForCollectionSlug('unknown')).toBeUndefined()
  })
})
