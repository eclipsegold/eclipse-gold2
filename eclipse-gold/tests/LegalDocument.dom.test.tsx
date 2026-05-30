import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { LegalDocument } from '../components/LegalDocument'
import type { LegalEntity, LegalPageContent } from '../data/types'

afterEach(() => cleanup())

const entity: LegalEntity = {
  companyName: 'Eclipse Gold SàRL',
  legalForm: 'SàRL',
  address: ['Genève', 'Suisse'],
  country: 'Suisse',
  vatId: 'Non assujetti',
  registrationId: 'CHE-1',
  email: 'hello@eg.test',
  privacyEmail: 'privacy@eg.test',
  publisher: 'Jane Doe',
  host: ['Vercel Inc.'],
}

const content: LegalPageContent = {
  slug: { fr: 'cgv', de: 'agb', it: 'condizioni-vendita' },
  seoTitle: { fr: 's', de: 's', it: 's' },
  metaDescription: { fr: 'd', de: 'd', it: 'd' },
  title: { fr: 'Conditions générales', de: 'AGB', it: 'Condizioni' },
  intro: { fr: 'Édité par {companyName}.', de: '', it: '' },
  updatedAt: '2026-05-30',
  sections: [
    {
      heading: { fr: 'Paiement', de: 'Zahlung', it: 'Pagamento' },
      body: { fr: ['Contact : {email}.'], de: ['x'], it: ['x'] },
      bullets: { fr: ['Carte', 'Apple Pay'], de: ['x'], it: ['x'] },
    },
  ],
}

describe('LegalDocument', () => {
  it('renders the localized title and section heading', () => {
    render(<LegalDocument content={content} lang="fr" entity={entity} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Conditions générales' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Paiement' })).toBeInTheDocument()
  })

  it('interpolates entity tokens in intro and body', () => {
    render(<LegalDocument content={content} lang="fr" entity={entity} />)
    expect(screen.getByText('Édité par Eclipse Gold SàRL.')).toBeInTheDocument()
    expect(screen.getByText('Contact : hello@eg.test.')).toBeInTheDocument()
  })

  it('renders bullets as list items', () => {
    render(<LegalDocument content={content} lang="fr" entity={entity} />)
    expect(screen.getByText('Apple Pay')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('omits the intro when it is empty for the language', () => {
    render(<LegalDocument content={content} lang="de" entity={entity} />)
    expect(screen.queryByText(/Édité par/)).not.toBeInTheDocument()
  })
})
