import { describe, it, expect } from 'vitest'
import { generateStaticParams } from '../app/[lang]/[collection]/[product]/page'

describe('[product] generateStaticParams', () => {
  it('returns 3 langs × 10 products = 30 entries with localized slugs', async () => {
    const params = await generateStaticParams()
    expect(params).toHaveLength(30)
    expect(params).toContainEqual({
      lang: 'fr',
      collection: 'lunettes-de-soleil-rimless-or',
      product: 'nebula-or-femme',
    })
  })
})
