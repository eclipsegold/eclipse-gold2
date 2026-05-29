import { describe, it, expect } from 'vitest'
import { getAllModels, getModelByHandle, getModelBySlug } from '../data/queries'

describe('model lookups', () => {
  it('returns the NEBULA model by handle', () => {
    const m = getModelByHandle('nebula')
    expect(m?.modelName).toBe('NEBULA')
    expect(m?.phenomenon).toBe('nebula')
  })

  it('resolves a model by its localized slug', () => {
    expect(getModelBySlug('nebula-or-femme', 'fr')?.handle).toBe('nebula')
    expect(getModelBySlug('nebula-gold-damen', 'de')?.handle).toBe('nebula')
    expect(getModelBySlug('nebula-oro-donna', 'it')?.handle).toBe('nebula')
  })

  it('returns undefined for an unknown handle', () => {
    expect(getModelByHandle('does-not-exist')).toBeUndefined()
  })

  it('exposes every model through getAllModels', () => {
    expect(getAllModels().some((m) => m.handle === 'nebula')).toBe(true)
  })
})
