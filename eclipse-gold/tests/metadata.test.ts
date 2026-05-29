import { describe, it, expect, beforeEach } from 'vitest'
import { buildMetadata } from '../lib/seo/metadata'

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://eclipsegold.com'
})

describe('buildMetadata', () => {
  const pathByLang = { fr: '/fr/x', de: '/de/x', it: '/it/x' }

  it('sets canonical to the current lang absolute URL', () => {
    const m = buildMetadata({ lang: 'fr', pathByLang, title: 'T', description: 'D' })
    expect(m.alternates?.canonical).toBe('https://eclipsegold.com/fr/x')
  })

  it('emits hreflang for all langs plus x-default → fr', () => {
    const m = buildMetadata({ lang: 'de', pathByLang, title: 'T', description: 'D' })
    const langs = m.alternates?.languages as Record<string, string>
    expect(langs['fr']).toBe('https://eclipsegold.com/fr/x')
    expect(langs['de']).toBe('https://eclipsegold.com/de/x')
    expect(langs['it']).toBe('https://eclipsegold.com/it/x')
    expect(langs['x-default']).toBe('https://eclipsegold.com/fr/x')
  })

  it('passes title and description through', () => {
    const m = buildMetadata({ lang: 'fr', pathByLang, title: 'T', description: 'D' })
    expect(m.title).toBe('T')
    expect(m.description).toBe('D')
  })
})
