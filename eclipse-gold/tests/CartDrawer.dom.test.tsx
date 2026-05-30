import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import { CartProvider, useCart } from '../components/CartContext'
import { CartDrawer } from '../components/CartDrawer'

afterEach(() => cleanup())
beforeEach(() => localStorage.clear())

function Seed({ handle }: { handle: string }) {
  const { addItem } = useCart()
  return <button onClick={() => addItem(handle)}>seed</button>
}

describe('CartDrawer', () => {
  it('shows the empty state when there are no lines', () => {
    render(<CartProvider><CartDrawer lang="fr" /></CartProvider>)
    expect(screen.getByText(/votre panier est vide/i)).toBeInTheDocument()
  })

  it('lists a line after adding and shows the checkout link', () => {
    render(<CartProvider><Seed handle="nebula" /><CartDrawer lang="fr" /></CartProvider>)
    act(() => { screen.getByText('seed').click() })
    expect(screen.getByText('nebula')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /paiement/i })).toHaveAttribute('href', '/fr/checkout')
  })
})
