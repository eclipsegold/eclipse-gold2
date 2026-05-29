import { describe, it, expect } from 'vitest'
import { validateModels, validateFullSet, validateCollectionOrder } from '../scripts/validate-models'
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

describe('validateFullSet', () => {
  const PHENOMENA = ['totality','heliacal','nebula','umbra','zenith','syzygy','penumbra','parhelion','equinox','chroma'] as const

  // Build N fully-distinct, valid models (unique handle/slug/keyword/order/phenomenon).
  function makeN(n: number): SunglassModel[] {
    return Array.from({ length: n }, (_, i) =>
      makeModel({
        handle: `m${i}`,
        order: i + 1,
        phenomenon: PHENOMENA[i],
        slug: { fr: `s${i}-fr`, de: `s${i}-de`, it: `s${i}-it` },
        primaryKeyword: { fr: `k${i}-fr`, de: `k${i}-de`, it: `k${i}-it` },
      }),
    )
  }

  it('accepts a complete, valid 10-model set', () => {
    expect(validateFullSet(makeN(10))).toEqual([])
  })

  it('flags the wrong model count', () => {
    const errors = validateFullSet(makeN(9))
    expect(errors.some((e) => e.code === 'WRONG_COUNT')).toBe(true)
  })

  it('flags duplicate order values', () => {
    const models = makeN(10)
    models[1].order = models[0].order
    const errors = validateFullSet(models)
    expect(errors.some((e) => e.code === 'DUPLICATE_ORDER')).toBe(true)
  })

  it('flags duplicate phenomenon values', () => {
    const models = makeN(10)
    models[1].phenomenon = models[0].phenomenon
    const errors = validateFullSet(models)
    expect(errors.some((e) => e.code === 'DUPLICATE_PHENOMENON')).toBe(true)
  })
})

describe('validateCollectionOrder', () => {
  const a = makeModel({ handle: 'a', slug: { fr: 'a', de: 'a', it: 'a' }, primaryKeyword: { fr: 'ka', de: 'ka', it: 'ka' } })
  const b = makeModel({ handle: 'b', order: 2, phenomenon: 'umbra', slug: { fr: 'b', de: 'b', it: 'b' }, primaryKeyword: { fr: 'kb', de: 'kb', it: 'kb' } })

  it('passes when modelOrder exactly matches the model handles', () => {
    expect(validateCollectionOrder([a, b], ['a', 'b'])).toEqual([])
  })

  it('flags a modelOrder handle with no matching model', () => {
    const errors = validateCollectionOrder([a, b], ['a', 'b', 'typo'])
    expect(errors.some((e) => e.code === 'ORPHAN_ORDER_HANDLE')).toBe(true)
  })

  it('flags a model missing from modelOrder', () => {
    const errors = validateCollectionOrder([a, b], ['a'])
    expect(errors.some((e) => e.code === 'MISSING_FROM_ORDER')).toBe(true)
  })
})
