import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { CartProvider, useCart } from '../components/CartContext'
import { CurrencyProvider } from '../components/CurrencyContext'
import { CheckoutForm } from '../components/CheckoutForm'

// CheckoutForm calls useStripe()/useElements() unconditionally (before the
// empty-cart early return), which require an <Elements> provider. Stub the
// Stripe hooks so the component can render without real Stripe context.
vi.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => null,
  useElements: () => null,
  PaymentElement: () => null,
}))

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
    render(<CurrencyProvider><CartProvider><CheckoutForm lang="fr" /></CartProvider></CurrencyProvider>)
    expect(screen.getByText(/panier (est )?vide/i)).toBeInTheDocument()
  })
})
