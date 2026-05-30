import { describe, it, expect } from 'vitest'
import { interpolateEntity } from '../lib/legal'
import type { LegalEntity } from '../data/types'

const entity: LegalEntity = {
  companyName: 'Eclipse Gold',
  legalForm: 'SàRL',
  address: ['Genève', 'Suisse'],
  country: 'Suisse',
  vatId: 'Non assujetti',
  registrationId: 'CHE-XXX',
  email: 'eclipsegold@outlook.fr',
  privacyEmail: 'eclipsegold@outlook.fr',
  publisher: 'Jane Doe',
  host: ['Vercel Inc.'],
}

describe('interpolateEntity', () => {
  it('replaces a single token', () => {
    expect(interpolateEntity('Société {companyName}.', entity)).toBe('Société Eclipse Gold.')
  })

  it('replaces multiple distinct tokens', () => {
    expect(interpolateEntity('{companyName} — {email}', entity))
      .toBe('Eclipse Gold — eclipsegold@outlook.fr')
  })

  it('joins array fields with a comma', () => {
    expect(interpolateEntity('Adresse : {address}', entity)).toBe('Adresse : Genève, Suisse')
  })

  it('leaves unknown tokens untouched', () => {
    expect(interpolateEntity('Hello {unknown}', entity)).toBe('Hello {unknown}')
  })

  it('returns the input unchanged when there are no tokens', () => {
    expect(interpolateEntity('plain text', entity)).toBe('plain text')
  })
})
