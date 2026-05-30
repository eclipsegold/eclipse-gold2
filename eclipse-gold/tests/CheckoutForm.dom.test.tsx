import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { CartProvider, useCart } from '../components/CartContext'
import { CheckoutForm } from '../components/CheckoutForm'

afterEach(() => cleanup())
beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ clientSecret: 'cs_test' }) }))
})

function Seed() {
  const { addItem } = useCart()
  return <button onClick={() => addItem('nebula')}>seed</button>
}

describe('CheckoutForm', () => {
  it('shows the empty-cart notice when there are no lines', () => {
    render(<CartProvider><CheckoutForm lang="fr" /></CartProvider>)
    expect(screen.getByText(/panier (est )?vide/i)).toBeInTheDocument()
  })
})
