import { describe, it, expect, beforeEach } from 'vitest'
import sitemap, { generateSitemaps } from '../app/sitemap'

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://eclipsegold.com'
})

describe('sitemap', () => {
  it('declares product, collection, and static sitemap ids', async () => {
    const ids = await generateSitemaps()
    expect(ids).toEqual([{ id: 'products' }, { id: 'collection' }, { id: 'static' }])
  })

  // Next 16 passes `id` as a Promise — mirror that contract in the tests.
  it('product sitemap has 30 localized URLs (3 langs × 10)', async () => {
    const entries = await sitemap({ id: Promise.resolve('products') })
    expect(entries).toHaveLength(30)
    expect(entries[0].url).toMatch(/^https:\/\/eclipsegold\.com\/(fr|de|it)\//)
  })

  it('collection sitemap has the 3 collection URLs', async () => {
    const entries = await sitemap({ id: Promise.resolve('collection') })
    expect(entries.map((e) => e.url)).toEqual([
      'https://eclipsegold.com/fr/lunettes-de-soleil-rimless-or',
      'https://eclipsegold.com/de/randlose-sonnenbrillen-gold',
      'https://eclipsegold.com/it/occhiali-da-sole-senza-montatura-oro',
    ])
  })

  it('static sitemap leads with the 3 home URLs', async () => {
    const entries = await sitemap({ id: Promise.resolve('static') })
    // Home URLs come first; legal pages follow (covered in legal-sitemap.test.ts).
    expect(entries.slice(0, 3).map((e) => e.url)).toEqual([
      'https://eclipsegold.com/fr',
      'https://eclipsegold.com/de',
      'https://eclipsegold.com/it',
    ])
  })
})
