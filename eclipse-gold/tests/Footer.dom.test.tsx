import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Footer } from '../components/Footer'

afterEach(() => cleanup())

describe('Footer', () => {
  it('links to all six trust pages with localized hrefs (fr)', () => {
    render(<Footer lang="fr" />)
    const expected = [
      '/fr/infos/mentions-legales',
      '/fr/infos/cgv',
      '/fr/infos/confidentialite',
      '/fr/infos/cookies',
      '/fr/infos/livraison',
      '/fr/infos/retours',
    ]
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    for (const href of expected) expect(hrefs).toContain(href)
  })

  it('uses the German slugs when lang is de', () => {
    render(<Footer lang="de" />)
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/de/infos/impressum')
    expect(hrefs).toContain('/de/infos/datenschutz')
  })
})
