import { describe, it, expect } from 'vitest'
import { collectionHub } from '../data/collection'
import { LANGS } from '../data/types'

describe('collection hub', () => {
  it('has a non-empty seoTitle in every language', () => {
    for (const lang of LANGS) {
      expect(collectionHub.seoTitle[lang].length).toBeGreaterThan(0)
    }
  })

  it('orders models by handle', () => {
    expect(collectionHub.modelOrder).toContain('nebula')
  })
})
