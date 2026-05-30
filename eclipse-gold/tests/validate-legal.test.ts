import { describe, it, expect } from 'vitest'
import { validateLegal } from '../scripts/validate-models'
import { legalPages } from '../data/legal'
import type { LegalPage, LegalPageContent } from '../data/types'

type Pages = Record<LegalPage, LegalPageContent>

describe('validateLegal', () => {
  it('returns no errors for the real legal content', () => {
    expect(validateLegal(legalPages)).toEqual([])
  })

  it('flags a missing page', () => {
    const broken = structuredClone(legalPages) as Partial<Pages>
    delete broken.cookies
    const errors = validateLegal(broken as Pages)
    expect(errors.some((e) => e.code === 'MISSING_LEGAL_PAGE' && e.message.includes('cookies'))).toBe(true)
  })

  it('flags a duplicate slug within a language', () => {
    const broken = structuredClone(legalPages)
    broken.cookies.slug.fr = broken.terms.slug.fr // collide on fr
    const errors = validateLegal(broken)
    expect(errors.some((e) => e.code === 'DUPLICATE_LEGAL_SLUG')).toBe(true)
  })

  it('flags an empty translation', () => {
    const broken = structuredClone(legalPages)
    broken.terms.title.de = ''
    const errors = validateLegal(broken)
    expect(errors.some((e) => e.code === 'EMPTY_TRANSLATION' && e.message.includes('de'))).toBe(true)
  })
})
