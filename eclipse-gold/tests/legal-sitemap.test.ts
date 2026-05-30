import { describe, it, expect, beforeEach } from 'vitest'
import sitemap from '../app/sitemap'
import { abs } from '../lib/seo/metadata'

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://eclipsegold.com'
})

describe('static sitemap split includes legal pages', () => {
  it('contains the fr CGV, de Impressum and it Spedizioni URLs', async () => {
    const entries = await sitemap({ id: Promise.resolve('static') })
    const urls = entries.map((e) => e.url)
    expect(urls).toContain(abs('/fr/infos/cgv'))
    expect(urls).toContain(abs('/de/infos/impressum'))
    expect(urls).toContain(abs('/it/infos/spedizioni'))
  })

  it('adds 18 legal URLs (6 pages × 3 langs) on top of the 3 home URLs', async () => {
    const entries = await sitemap({ id: Promise.resolve('static') })
    expect(entries).toHaveLength(3 + 18)
  })
})
