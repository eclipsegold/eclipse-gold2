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

  it('product sitemap has 30 localized URLs (3 langs × 10)', async () => {
    const entries = await sitemap({ id: 'products' })
    expect(entries).toHaveLength(30)
    expect(entries[0].url).toMatch(/^https:\/\/eclipsegold\.com\/(fr|de|it)\//)
  })

  it('static sitemap has the 3 home URLs', async () => {
    const entries = await sitemap({ id: 'static' })
    expect(entries.map((e) => e.url)).toEqual([
      'https://eclipsegold.com/fr',
      'https://eclipsegold.com/de',
      'https://eclipsegold.com/it',
    ])
  })
})
