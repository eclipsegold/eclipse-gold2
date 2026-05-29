import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CurrencyProvider } from '../components/CurrencyContext'
import { Header } from '../components/Header'

describe('Header', () => {
  it('renders brand, a cart stub, and the collection link', () => {
    render(
      <CurrencyProvider initialCountry="CH">
        <Header lang="fr" />
      </CurrencyProvider>,
    )
    expect(screen.getByText('Eclipse Gold')).toBeInTheDocument()
    expect(screen.getByLabelText('Panier')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /collection/i })).toHaveAttribute(
      'href',
      '/fr/lunettes-de-soleil-rimless-or',
    )
  })
})
