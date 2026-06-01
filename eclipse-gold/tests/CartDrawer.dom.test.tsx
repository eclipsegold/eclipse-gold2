import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import { CartProvider, useCart } from '../components/CartContext'
import { CurrencyProvider } from '../components/CurrencyContext'
import { CartDrawer } from '../components/CartDrawer'
import type { ReactNode } from 'react'

afterEach(() => cleanup())
beforeEach(() => localStorage.clear())

function Wrap({ children }: { children: ReactNode }) {
  return (
    <CurrencyProvider initialCountry="CH">
      <CartProvider>{children}</CartProvider>
    </CurrencyProvider>
  )
}

function Seed({ handle }: { handle: string }) {
  const { addItem } = useCart()
  return <button onClick={() => addItem(handle)}>seed</button>
}

describe('CartDrawer', () => {
  it('shows the empty state when there are no lines', () => {
    render(<Wrap><CartDrawer lang="fr" /></Wrap>)
    expect(screen.getByText(/votre panier est vide/i)).toBeInTheDocument()
  })

  it('lists a line after adding and shows the checkout link', () => {
    render(<Wrap><Seed handle="nebula" /><CartDrawer lang="fr" /></Wrap>)
    act(() => { screen.getByText('seed').click() })
    expect(screen.getByText('nebula')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /paiement/i })).toHaveAttribute('href', '/fr/checkout')
  })
})
