import { describe, it, expect } from 'vitest'
import { generateStaticParams } from '../app/[lang]/[collection]/page'

describe('[collection] generateStaticParams', () => {
  it('returns the localized collection slug for each language', async () => {
    const params = await generateStaticParams()
    expect(params).toContainEqual({ lang: 'fr', collection: 'lunettes-de-soleil-rimless-or' })
    expect(params).toContainEqual({ lang: 'de', collection: 'randlose-sonnenbrillen-gold' })
    expect(params).toHaveLength(3)
  })
})
