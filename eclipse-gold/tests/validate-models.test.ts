import { describe, it, expect } from 'vitest'
import { validateModels } from '../scripts/validate-models'
import type { SunglassModel } from '../data/types'

function makeModel(over: Partial<SunglassModel>): SunglassModel {
  const L = (s: string) => ({ fr: s, de: s, it: s })
  return {
    handle: 'x', modelName: 'X', phenomenon: 'nebula', order: 1, featured: false,
    shape: 'round', audience: 'unisexe', polarized: false, lensTint: 'gold',
    slug: L('x'), primaryKeyword: L('kw-x'), seoTitle: L('t'),
    metaDescription: L('m'), tagline: L('tag'), intro: L('intro'),
    features: { fr: ['a'], de: ['a'], it: ['a'] },
    ...over,
  }
}

describe('validateModels', () => {
  it('flags a duplicate slug within a language', () => {
    const errors = validateModels([
      makeModel({ handle: 'a', slug: { fr: 'same', de: 'a-de', it: 'a-it' } }),
      makeModel({ handle: 'b', slug: { fr: 'same', de: 'b-de', it: 'b-it' } }),
    ])
    expect(errors.some((e) => e.code === 'DUPLICATE_SLUG')).toBe(true)
  })

  it('flags a duplicate primaryKeyword within a language', () => {
    const errors = validateModels([
      makeModel({ handle: 'a', primaryKeyword: { fr: 'dup', de: 'a', it: 'a' }, slug: { fr: 'a', de: 'a', it: 'a' } }),
      makeModel({ handle: 'b', primaryKeyword: { fr: 'dup', de: 'b', it: 'b' }, slug: { fr: 'b', de: 'b', it: 'b' } }),
    ])
    expect(errors.some((e) => e.code === 'DUPLICATE_KEYWORD')).toBe(true)
  })

  it('flags an empty localized field', () => {
    const errors = validateModels([makeModel({ tagline: { fr: '', de: 'x', it: 'x' } })])
    expect(errors.some((e) => e.code === 'EMPTY_TRANSLATION')).toBe(true)
  })

  it('returns no errors for a single valid model', () => {
    expect(validateModels([makeModel({})])).toEqual([])
  })
})
