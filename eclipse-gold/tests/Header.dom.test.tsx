import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { CurrencyProvider } from '../components/CurrencyContext'
import { CartProvider } from '../components/CartContext'
import { Header } from '../components/Header'

afterEach(() => cleanup())
beforeEach(() => localStorage.clear())

describe('Header', () => {
  it('renders brand, the cart button, and the collection link', () => {
    render(
      <CurrencyProvider>
        <CartProvider>
          <Header lang="fr" />
        </CartProvider>
      </CurrencyProvider>,
    )
    expect(screen.getByText('Eclipse Gold')).toBeInTheDocument()
    expect(screen.getByLabelText(/panier/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /collection/i })).toHaveAttribute(
      'href',
      '/fr/lunettes-de-soleil-rimless-or',
    )
  })
})
