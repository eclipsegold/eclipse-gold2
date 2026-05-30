import { describe, it, expect } from 'vitest'
import { generateStaticParams } from '../app/[lang]/layout'

describe('[lang] generateStaticParams', () => {
  it('returns one entry per language', async () => {
    const params = await generateStaticParams()
    expect(params).toEqual([{ lang: 'fr' }, { lang: 'de' }, { lang: 'it' }])
  })
})
