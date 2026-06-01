import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { CartProvider } from '../components/CartContext'

// Stripe redirects back with these query params; simulate a successful payment.
vi.mock('next/navigation', () => ({
  useSearchParams: () =>
    new URLSearchParams('redirect_status=succeeded&payment_intent=pi_test_1'),
}))

import { ConfirmationView } from '../app/[lang]/checkout/confirmation/page'

afterEach(() => cleanup())
beforeEach(() => localStorage.setItem('eg-cart', JSON.stringify([{ handle: 'nebula', quantity: 1 }])))

describe('ConfirmationView', () => {
  it('shows a thank-you message and clears the cart', () => {
    render(<CartProvider><ConfirmationView lang="fr" /></CartProvider>)
    expect(screen.getByText(/merci/i)).toBeInTheDocument()
    expect(localStorage.getItem('eg-cart')).toBe('[]')
  })
})
